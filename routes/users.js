if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const m = require('../config/middlewares');
const transporter = require('../config/transporter');
const passport = require('passport');
const initializePassport = require('../config/passportConfig');
const speakeasy = require('speakeasy');
const webpush = require('web-push');
const qrcode = require('qrcode');
initializePassport(passport);

router.get('/',async(req,res)=>{
	try {
		const users = await User.find({});
		res.status(200).json(users);
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.post('/userprofile',[m.isAuthenticated,m.refreshToken()],async function(req,res){
	try {
		const user = await User.findById(req._id);
		res.status(200).json({user: user,accessToken: req.accessToken});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/verifyEmail/:token',async(req,res)=>{
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.EMAIL_SECRET);
		const user = await User.findById(tokenPayload._id);
		if (!user.emailVerified){
			await User.findOneAndUpdate({_id: ObjectId(tokenPayload._id)},{ $set: { emailVerified: true }});
			res.status(200).json({message: 'Az email cím sikeresen megerősítve'});
		} else {
			res.status(400).json({message: 'Ez az email cím már meg van erősítve'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/verifyDataRequest/:token',async(req,res)=>{
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.DATA_REQUEST_TOKEN);
		res.status(200).json({message: 'Sikeres adatigénylés',format: tokenPayload.format});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/register',async(req,res)=>{
	const newUser = new User({
		first_name : req.body.first_name,
		last_name : req.body.last_name,
		email : req.body.email,
		password : req.body.password,
		consentToGDPR : req.body.consentToGDPR,
		consentToNewsletter : req.body.consentToNewsletter
	})

	try {
		await newUser.save();
		sendVerificationLink(newUser,res);
	} catch(err){
		if (err.code==11000){
			return res.status(400).json({message: 'Ezzel az email címmel már regisztráltak.'});
		}
		res.status(500).json({message: err.message});
	}
});

router.post('/resendVerificationLink',async(req,res)=>{
	let user;
	try {
		user = await User.findOne({email: req.body.email});
		sendVerificationLink(user,res);
	} catch(err){
		if (!user){
			return res.status(400).json({message: 'Nem létezik felhasználó ezzel az email címmel'});
		}
		res.status(500).json({message: err.message});
	}
})

function sendVerificationLink(user,res){
	const emailToken = user.generateEmailToken();
	const verificationUrl = `${process.env.SITE_URL}/email-verification/${emailToken}`;
	transporter.sendMail({
		from: process.env.SITE_EMAIL_SENDER,
		to: user.email,
		subject: 'Erősítse meg email címét',
		context: {
			title : 'Erősítse meg email címét',
			firstName : user.first_name,
			lastName : user.last_name,
			email: user.email,
			siteUrl: process.env.SITE_URL,
			verificationUrl: verificationUrl
		},
		attachments : [{
			filename: 'logo.png',
			path: './public/images/logo.png',
			cid: 'logo'
		}],
		template: 'verification',
	},(err,info)=>{
		if (err) console.log(err);
		else {
			res.status(201).json({message: 'Az email címére elküdtük a regisztrációt megerősítő linket.'});
		}
	});
}

router.post('/login',function(req,res,next){
	passport.authenticate('local',function(err,user,info){
		if (err) {
			return res.status(500).json({message: err.message});
		}

		if (info) {
			return res.status(200).json({message: info});
		}

		if (user) {
			if (!user.emailVerified) {
				return res.status(200).json({emailVerified: false});
			}

			if (user.twoFactorGoogleEnabled && user.twoFactorEmailEnabled){
				return res.status(200).json({
					_id: user._id,
					tempAccessToken: user.generateTempAccessToken(),
					multipleTwoFactorEnabled: true
				});
			} else if (user.twoFactorGoogleEnabled) {
				return res.status(200).json({
					_id: user._id,
					tempAccessToken: user.generateTempAccessToken(),
					twoFactorGoogleEnabled: user.twoFactorGoogleEnabled
				});
			} else if (user.twoFactorEmailEnabled) {
				/*var token = speakeasy.totp({
					secret: user.twoFactorEmailSecret,
					encoding: 'base32'
				});

				transporter.sendMail({
					from: process.env.SITE_EMAIL_SENDER,
					to: user.email,
					subject: 'Email hitelesítés',
					context: {
						firstName : user.first_name,
						lastName : user.last_name,
						token : token
					},
					attachments : [{
						filename: 'logo.png',
						path: './public/images/logo.png',
						cid: 'logo'
					}],
					template: 'email_authentication',
				},(err,info)=>{
					if (err) console.log(err);
					else {
						res.status(201).json({
							_id: user._id,
							tempAccessToken: user.generateTempAccessToken(),
							twoFactorEmailEnabled: user.twoFactorEmailEnabled,
							message: 'Az email címére elküdtük a hitelesítő kódot.'
						});
					}
				});*/
				sendTwoFactorEmail(res,user);
			} else {
				return res.status(200).json({
					accessToken: user.generateAccessToken(),
					refreshToken: user.generateRefreshToken()
				});
			}
		}
	})(req,res,next);
})

router.get('/sendTwoFactorEmail',m.isTempAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		sendTwoFactorEmail(res,user);
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

function sendTwoFactorEmail(res,user) {
	var token = speakeasy.totp({
		secret: user.twoFactorEmailSecret,
		encoding: 'base32'
	});

	transporter.sendMail({
		from: process.env.SITE_EMAIL_SENDER,
		to: user.email,
		subject: 'Email hitelesítés',
		context: {
			firstName : user.first_name,
			lastName : user.last_name,
			token : token
		},
		attachments : [{
			filename: 'logo.png',
			path: './public/images/logo.png',
			cid: 'logo'
		}],
		template: 'email_authentication',
	},(err,info)=>{
		if (err) console.log(err);
		else {
			res.status(201).json({
				_id: user._id,
				tempAccessToken: user.generateTempAccessToken(),
				twoFactorEmailEnabled: user.twoFactorEmailEnabled,
				message: 'Az email címére elküdtük a hitelesítő kódot.'
			});
		}
	});
}

router.get('/generateEmailSecret',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		const secret = speakeasy.generateSecret();

		var token = speakeasy.totp({
			secret: secret.base32,
			encoding: 'base32'
		});

		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$set : {twoFactorTempSecret: secret.base32}},
			{upsert: true, new: true},(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				//else return res.status(200).json({token: token});
				else {
					transporter.sendMail({
						from: process.env.SITE_EMAIL_SENDER,
						to: user.email,
						subject: 'Email hitelesítés',
						context: {
							firstName : user.first_name,
							lastName : user.last_name,
							token : token
						},
						attachments : [{
							filename: 'logo.png',
							path: './public/images/logo.png',
							cid: 'logo'
						}],
						template: 'email_authentication',
					},(err,info)=>{
						if (err) console.log(err);
						else {
							res.status(201).json({message: 'Az email címére elküdtük a hitelesítő kódot.'});
						}
					});
				}
			}
		);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
})

router.get('/generateQRcode',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		const secret = speakeasy.generateSecret({
			name : `Digital Deals (${user.email})`
		})

		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$set : {twoFactorTempSecret: secret.base32}},
			{upsert: true, new: true},(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else {
					qrcode.toDataURL(secret.otpauth_url,function(err,data){
						return res.status(200).json({qrcodeImgSrc: data});
					})
				}
			}
		);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
})

router.post('/enableTwoFactor',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		const tempSecret = user.twoFactorTempSecret;
		let verified;
		if (req.body.type=='appTwoFactor'){
			verified = speakeasy.totp.verify({
				secret: tempSecret,
				encoding: 'base32',
				token: req.body.code
			})
		} else if (req.body.type=='emailTwoFactor'){
			verified = speakeasy.totp.verify({
			  secret: tempSecret,
			  encoding: 'base32',
			  token: req.body.code,
			  window: 6
			});
		}

		if (verified){
			if (req.body.type=='appTwoFactor'){
				await User.findOneAndUpdate(
					{_id: ObjectId(req._id)},
					{$unset : {twoFactorTempSecret: 1},$set: {twoFactorGoogleSecret: tempSecret}},
					{upsert: true, new: true},(err,user)=>{
						if (err) return res.status(400).json({message: err.message});
						else return res.status(200).json({type: 'appTwoFactor',message: 'Alkalmazás hitelesítés sikeresen bekapcsolva'});
					}
				);
			} else if (req.body.type=='emailTwoFactor'){	
				await User.findOneAndUpdate(
					{_id: ObjectId(req._id)},
					{$unset : {twoFactorTempSecret: 1},$set: {twoFactorEmailSecret: tempSecret}},
					{upsert: true, new: true},(err,user)=>{
						if (err) return res.status(400).json({message: err.message});
						else return res.status(200).json({type: 'emailTwoFactor',message: 'Email hitelesítés sikeresen bekapcsolva'});
					}
				);
			}
		} else {
			return res.status(400).json({message: 'Helytelen vagy lejárt kód'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/verifyTwoFactorCode',m.isTempAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		let verified;
		if (req.body.type=='appTwoFactor'){
			verified = speakeasy.totp.verify({
				secret: user.twoFactorGoogleSecret,
				encoding: 'base32',
				token: req.body.code
			})
		} else if (req.body.type=='emailTwoFactor'){
			verified = speakeasy.totp.verify({
			  secret: user.twoFactorEmailSecret,
			  encoding: 'base32',
			  token: req.body.code,
			  window: 6
			});
		}

		if (verified){
			res.status(200).json({
				message: 'Sikeres belépés',
				accessToken: user.generateAccessToken(),
				refreshToken: user.generateRefreshToken()
			});
		} else {
			return res.status(400).json({message: 'Helytelen vagy lejárt kód'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.get('/downloadPersonalInformations',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		var jso = JSON.stringify(user);
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-disposition','attachment; filename=user.json');
		res.status(200).send(jso);
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/sendPersonalInformations',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		const dataRequestToken = user.generateDataRequestToken(req.body.format);
		const downloadUrl = `${process.env.SITE_URL}/data-request/${dataRequestToken}`;
		transporter.sendMail({
			from: process.env.SITE_EMAIL_SENDER,
			to: user.email,
			subject: 'Adatigénylés',
			context: {
				title : 'Adatigénylés',
				firstName : user.first_name,
				lastName : user.last_name,
				email: user.email,
				siteUrl: process.env.SITE_URL,
				format: req.body.format,
				downloadUrl: downloadUrl
			},
			attachments : [{
				filename: 'logo.png',
				path: './public/images/logo.png',
				cid: 'logo'
			}],
			template: 'data_request',
		},(err,info)=>{
			if (err) console.log(err);
			else {
				res.status(201).json({message: 'Az email címére elküdtük a letöltő linket.'});
			}
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/saveLoginDetails',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		console.log(user.lastLoginDetails.ip!=null);
		console.log(req.body.loginDetails.ip!==user.lastLoginDetails.ip);
		console.log(user.lastLoginDetails);
		console.log(req.body.loginDetails);
		if (user.lastLoginDetails.ip!=null && req.body.loginDetails.ip!==user.lastLoginDetails.ip){
			const securityAlertToken = user.generateSecurityAlertToken();
			const newPasswordToken = user.generateNewPasswordToken();
			const newPasswordUrl = `${process.env.SITE_URL}/new-password/${newPasswordToken}`;
			const confirmationUrl = `${process.env.SITE_URL}/security-alert/${securityAlertToken}`;
			const localeDate = new Date(req.body.loginDetails.date).toLocaleString();
			transporter.sendMail({
				from: process.env.SITE_EMAIL_SENDER,
				to: user.email,
				subject: 'Biztonsági értesítés',
				context: {
					firstName : user.first_name,
					lastName : user.last_name,
					securityAlertUrl: securityAlertUrl,
					newPasswordUrl: newPasswordUrl,
					loginDetails: req.body.loginDetails,
					localeDate: localeDate
				},
				attachments : [{
					filename: 'logo.png',
					path: './public/images/logo.png',
					cid: 'logo'
				}],
				template: 'security_alert',
			},(err,info)=>{
				if (err) console.log(err);
				else {
					res.status(201).json({message: 'Biztonsági értesítő email elküldve az email címére.'});
				}
			});
		}

		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$set: {lastLoginDetails : req.body.loginDetails}},
			(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else res.sendStatus(200);
			}
		);
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/getGameHistory',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		res.status(200).json({gameHistory: user.gameHistory});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/deleteGameHistory',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findOneAndUpdate({_id: ObjectId(req._id)},{$unset: {gameHistory:1}});
		res.status(200).json({message: 'Előzmények törölve'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/addToGameHistory',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$addToSet: {gameHistory : {gameId: req.body.gameId, date: new Date()}}},
			{upsert: true, new: true},
			(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else res.sendStatus(200);
			}
		);
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.post('/forgotten',async(req,res)=>{
	let user;
	try {
		user = await User.findOne({email: req.body.email});
		const forgottenPasswordToken = user.generateForgottenToken();
		const forgottenPasswordUrl = `${process.env.SITE_URL}/new-password/${forgottenPasswordToken}`;
		transporter.sendMail({
			from: process.env.SITE_EMAIL_SENDER,
			to: req.body.email,
			subject: 'Elfelejtett jelszó',
			context: {
				firstName: user.first_name,
				lastName: user.last_name,
				forgottenPasswordUrl: forgottenPasswordUrl
			},
			attachments: [{
				name: 'logo.png',
				path: './public/images/logo.png',
				cid: 'logo'
			}],
			template: 'forgotten_password'
		},(err,info)=>{
			if (err) res.status(400).json({message: err.message});
			else res.status(200).json({message: 'Az új jelszó létrehozásához szükséges link elküldve az email címére.'})
		})
	} catch(err){
		if (!user){
			return res.status(400).json({message: 'Nem létezik felhasználó ezzel az email címmel'});
		}
		res.status(500).json({message: err.message});
	}
});

router.get('/forgotten/:token',async(req,res)=>{
	let user;
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.FORGOTTEN_SECRET);
		user = await User.findOne({
			_id: ObjectId(tokenPayload._id),
			lastPasswordChange: { $lt: new Date(tokenPayload.iat*1000) }
		},(err,doc)=>{
			if (err) console.log(err);
			else if (doc) return res.status(200).json({authorized: true});
			else return res.status(400).json({message: 'A link már fel volt használva.'});
		});
	} catch(err){
		/*if (!user){
			return res.status(400).json({message: 'A link már fel volt használva.'});
		}*/
		res.status(500).json({message: err.message});
	}
})

router.post('/refreshAccessToken',[m.isAuthenticated,m.refreshToken()],async function(req,res){
	res.json({accessToken: req.accessToken});
});

router.delete('/logout',m.isAuthenticated,(req,res)=>{
	refreshTokens = refreshTokens.filter(token=>token!==req.body.token);
	res.sendStatus(204);
});

router.put('/updatePassword/:token',async(req,res)=>{
	let user;
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.FORGOTTEN_SECRET);
		user = await User.findOneAndUpdate({
			_id: ObjectId(tokenPayload._id),
			lastPasswordChange: { $lt: new Date(tokenPayload.iat*1000) }
		},
		{
			$set: { password: req.body.password, lastPasswordChange: new Date() }
		},
		{ new: true },
		(err,doc)=>{
			if (err) console.log(err);
			else if (doc) return res.status(200).json({updated: true});
			else return res.status(400).json({message: 'A link már fel volt használva'});
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.put('/updateUser/:id',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate({_id: ObjectId(req.params.id)},{$set: req.body});
		res.status(200).json({message: 'Profil sikeresen frissítve'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.put('/deleteProperties/:id',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate({_id: ObjectId(req.params.id)},{$unset: req.body});
		res.status(200).json({message: 'Profil sikeresen frissítve'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

webpush.setVapidDetails(`mailto:${process.env.SITE_EMAIL}`, process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID)
let fakeDatabase = [];

router.post('/subscription', (req, res) => {
  const subscription = req.body
  fakeDatabase.push(subscription)
})

router.post('/sendPushNotifications',m.isAuthenticated, (req, res) => {
  const notificationPayload = {
    notification: {
      title: req.body.pushNotificationTitle,
      body: req.body.pushNotificationText,
      icon: 'assets/deal.png',
    },
  }
  
  const promises = []
  fakeDatabase.forEach(subscription => {
    promises.push(
      webpush.sendNotification(subscription,JSON.stringify(notificationPayload))
    )
  })
  //Promise.all(promises).then(() => res.sendStatus(200))
  Promise.all(promises)
  	.then(() => res.status(200).json({message: 'Push értesítések elküldve'}))
  	.catch((err)=>{
  		res.status(500).json({message: err.message});
  	});
})

router.post('/sendMessages',m.isAuthenticated,async(req,res)=>{
	try {
		await User.updateMany({},{$push: {messages: {type: req.body.messageType,title: req.body.messageTitle,text: req.body.messageText}}});
		res.status(200).json({message: 'Üzenet elküldve'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/messages',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		let messagesUnread=0;
		user.messages.forEach(message=>{
			/*console.log(message.date);
			console.log(user.messagesWereReadAt.getTime());
			console.log(message.date.getTime()>user.messagesWereReadAt.getTime());
			if (message.date.getTime()>user.messagesWereReadAt.getTime()){
				++messagesUnread;
			}*/
			if (message.read==false){
				++messagesUnread;
			}
		})
		res.status(200).json({messages: user.messages,messagesUnread: messagesUnread});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.put('/markMessagesAsRead',m.isAuthenticated,async(req,res)=>{
	try {
		if (req.body.messageIds.length>0){
			for(let i=0;i<req.body.messageIds.length;i++){
				await User.findOneAndUpdate({_id: ObjectId(req._id),'messages._id': ObjectId(req.body.messageIds[i])},{$set: {'messages.$.read':true}},{new:true},(err,doc)=>{
					if (err) return res.status(500).json({message: err.message});
					else if (i==req.body.messageIds.length-1){
						return res.status(200).json({messages: 'Üzenet olvasottnak jelölve'});
					}
				});
			}
		} else {
			return res.status(200).json({messages: 'Nincsenek üzenetek'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.put('/deleteSelectedMessages',m.isAuthenticated,async(req,res)=>{
	try {
		if (req.body.messageIds.length>0){
			for(let i=0;i<req.body.messageIds.length;i++){
				await User.findOneAndUpdate({_id: ObjectId(req._id)},{$pull:{'messages': {_id: ObjectId(req.body.messageIds[i])}}},(err,doc)=>{
					if (err) return res.status(500).json({message: err.message});
					else if (i==req.body.messageIds.length-1){
						return res.status(200).json({messages: 'Üzenet törölve'});
					}
				});
			}
		} else {
			return res.status(200).json({messages: 'Nincsenek üzenetek'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/sendNewsletters',m.isAuthenticated,async(req,res)=>{
	try {
		let subject;
		let template;
		if (req.body.newsletterType==='deals'){
			subject = 'Hírlevél - Akciós ajánlatok';
			template = 'newsletter_deals';
		} else {
			subject = `Hírlevél - ${req.body.newsletterTitle}`;
			template = 'newsletter_other';
		}

		const usersSubscribedToNewsletter = await User.find({consentToNewsletter: true});
		if (usersSubscribedToNewsletter.length===0){
			return res.status(200).json({message: `Egyik felhasználó sem kér hírlevelet`});
		} else {
			for(let i=0;i<usersSubscribedToNewsletter.length;i++){
				transporter.sendMail({
					from: process.env.SITE_EMAIL_SENDER,
					to: usersSubscribedToNewsletter[i].email,
					subject: subject,
					context: {
						firstName: usersSubscribedToNewsletter[i].first_name,
						lastName: usersSubscribedToNewsletter[i].last_name,
						title: req.body.newsletterTitle,
						text: req.body.newsletterText
					},
					attachments: [{
						name: 'logo.png',
						path: './public/images/logo.png',
						cid: 'logo'
					}],
					template: template
				},(err,info)=>{
					if (err) return res.status(400).json({message: err.message});
					else if (i===usersSubscribedToNewsletter.length-1) {
						return res.status(200).json({message: `Hírlevelek elküldve`});
					}
				})
			}
		}
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.get('/:id',m.isAuthenticated,async(req,res)=>{
	try {
		res.status(200).json(req.user);
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.delete('/:id',m.isAuthenticated,async(req,res)=>{
	try {
		user = await User.findById(req.params.id);
		await user.remove();
		res.status(200).json({message: 'Profil sikeresen törölve'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

module.exports = router;