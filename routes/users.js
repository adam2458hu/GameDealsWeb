if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();
const User = require('../models/user');
const Game = require('../models/game');
const jwt = require('jsonwebtoken');
const m = require('../config/middlewares');
const transporter = require('../config/transporter');
const passport = require('passport');
const initializePassport = require('../config/passportConfig');
const speakeasy = require('speakeasy');
const webpush = require('web-push');
const qrcode = require('qrcode');
const i18next = require('i18next');
initializePassport(passport);

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
			res.status(200).json({message: 'emailSuccessfullyVerified'});
		} else {
			res.status(400).json({message: 'emailAlreadyVerified'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

async function deleteUnverifiedUsers(){
	try {
		const unverifiedUsers = await User.find({emailVerified: false});
		if (unverifiedUsers.length>0){
			const deletedUserCount = await loopThroughUnverifiedUsers(unverifiedUsers);
			console.log(unverifiedUsers.length +' megerősítetlen felhasználó közül '+deletedUserCount+' törölve az adatbázisból');
		} else {
			console.log("Nincs megerősítetlen felhasználó az adatbázisban");
		}
	} catch(err){
		console.log(err);
	}
}

function loopThroughUnverifiedUsers(unverifiedUsers){
	return new Promise((resolve,reject)=>{
		let counter=0;
		unverifiedUsers.forEach(async (user,index,arr)=>{
			const registrationDate = user.createdAt;
			const now = new Date();
			const timePassed = now.getTime()-registrationDate.getTime();
			if (timePassed>(1000*60*60*24*7)) {
				await user.remove();
				++counter;
			}

			if (index==arr.length-1){
				resolve(counter);
			}
		})
	})
}

router.get('/trustDevice/:token',async(req,res)=>{
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.TRUST_DEVICE_SECRET);
		const user = await User.findById(tokenPayload._id);
		if (user.trustedDevices.filter(device=>device.ip==tokenPayload.ip).length==0){
			const device = {
				ip : tokenPayload.ip,
				country : tokenPayload.country
			}
			await User.findOneAndUpdate({_id: ObjectId(tokenPayload._id)},{ $addToSet: { trustedDevices: device }});
			res.status(200).json({message: 'deviceMarkedTrustworthy'});
		} else {
			res.status(400).json({message: 'deviceAlreadyTrustworthy'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/untrustDevice/',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate({_id: ObjectId(req._id)},{$pull:{'trustedDevices': req.body.device}},(err,doc)=>{
			if (err) return res.status(500).json({message: err.message});
			else return res.status(200).json({message: 'deviceUntrusted'});
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/verifyDataRequest/:token',async(req,res)=>{
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.DATA_REQUEST_TOKEN);
		res.status(200).json({message: 'successfulDataRequest',format: tokenPayload.format});
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
		language : req.body.language,
		consentToGDPR : req.body.consentToGDPR,
		consentToNewsletter : req.body.consentToNewsletter
	})

	try {
		await newUser.save();
		i18next.changeLanguage(newUser.language,()=>{sendVerificationLink(newUser,res)});
	} catch(err){
		if (err.code==11000){
			return res.status(400).json({message: 'emailAlreadyRegistered'});
		}
		res.status(500).json({message: err.message});
	}
});

router.post('/resendVerificationLink',async(req,res)=>{
	let user;
	try {
		user = await User.findOne({email: req.body.email});
		i18next.changeLanguage(user.language,()=>{sendVerificationLink(user,res)});
	} catch(err){
		if (!user){
			return res.status(400).json({message: 'emailNotRegistered'});
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
		subject: i18next.t('emailVerification'),
		context: {
			title : i18next.t('emailVerification'),
			firstName : user.first_name,
			lastName : user.last_name,
			email: user.email,
			siteName: process.env.SITE_NAME,
			siteUrl: process.env.SITE_URL,
			verificationUrl: verificationUrl
		},
		attachments : [{
			filename: 'logo.png',
			path: './public/images/logo.png',
			cid: 'logo'
		}],
		template: `verification_${i18next.language}`,
	},(err,info)=>{
		if (err) console.log(err);
		else {
			res.status(201).json({message: 'verificationLinkSent'});
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
				return res.status(200).json({
					message: 'unverifiedEmail',
					emailVerified: false
				});
			}

			if (user.trustedDevices.filter(device=>device.ip==req.body.ip).length>0){
				return res.status(200).json({
						message: 'successfulLogin',
						accessToken: user.generateAccessToken(),
						refreshToken: user.generateRefreshToken()
					});
			} else if (user.twoFactorGoogleEnabled && user.twoFactorEmailEnabled){
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
				sendTwoFactorEmail(res,user);
			} else {
				if (req.body.rememberMe){
					return res.status(200).json({
						message: 'successfulLogin',
						accessToken: user.generateAccessToken(),
						refreshToken: user.generateRefreshToken(),
						rememberMeToken: user.generateRememberMeToken()
					})
				} else {
					return res.status(200).json({
						message: 'successfulLogin',
						accessToken: user.generateAccessToken(),
						refreshToken: user.generateRefreshToken()
					});
				}
			}
		}
	})(req,res,next);
})

router.get('/loginRememberedUser',m.isUserRemembered,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		console.log(user);
		if (user) {
			return res.status(200).json({
				accessToken: user.generateAccessToken(),
				refreshToken: user.generateRefreshToken()
			});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.get('/sendTwoFactorEmail',m.isTempAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		i18next.changeLanguage(user.language,()=>{sendTwoFactorEmail(res,user)});
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
		subject: i18next.t('emailAuthentication'),
		context: {
			firstName : user.first_name,
			lastName : user.last_name,
			token : token,
			siteName : process.env.SITE_NAME
		},
		attachments : [{
			filename: 'logo.png',
			path: './public/images/logo.png',
			cid: 'logo'
		}],
		template: `email_authentication_${i18next.language}`,
	},(err,info)=>{
		if (err) console.log(err);
		else {
			res.status(201).json({
				_id: user._id,
				tempAccessToken: user.generateTempAccessToken(),
				twoFactorEmailEnabled: user.twoFactorEmailEnabled,
				message: 'verificationCodeSent'
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
					i18next.changeLanguage(user.language,()=>{
						transporter.sendMail({
							from: process.env.SITE_EMAIL_SENDER,
							to: user.email,
							subject: i18next.t('emailAuthentication'),
							context: {
								firstName : user.first_name,
								lastName : user.last_name,
								token : token,
								siteName : process.env.SITE_NAME
							},
							attachments : [{
								filename: 'logo.png',
								path: './public/images/logo.png',
								cid: 'logo'
							}],
							template: `email_authentication_${i18next.language}`,
						},(err,info)=>{
							if (err) console.log(err);
							else {
								res.status(201).json({message: 'verificationCodeSent'});
							}
						});
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
			name : `Game Deals List (${user.email})`
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
						else return res.status(200).json({type: 'appTwoFactor',message: 'appAuthenticationEnabled'});
					}
				);
			} else if (req.body.type=='emailTwoFactor'){	
				await User.findOneAndUpdate(
					{_id: ObjectId(req._id)},
					{$unset : {twoFactorTempSecret: 1},$set: {twoFactorEmailSecret: tempSecret}},
					{upsert: true, new: true},(err,user)=>{
						if (err) return res.status(400).json({message: err.message});
						else return res.status(200).json({type: 'emailTwoFactor',message: 'emailAuthenticationEnabled'});
					}
				);
			}
		} else {
			return res.status(400).json({message: 'wrongOrExpiredCode'});
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
			if (req.body.ip) {
				if (user.trustedDevices.filter(device=>device.ip==req.body.ip).length==0){
					const device = {
						ip : req.body.ip,
						country : req.body.country
					}
					await User.findOneAndUpdate({_id: ObjectId(req._id)},{ $addToSet: { trustedDevices: device }});
				}
			}

			res.status(200).json({
				message: 'Sikeres belépés',
				accessToken: user.generateAccessToken(),
				refreshToken: user.generateRefreshToken()
			});
		} else {
			return res.status(400).json({message: 'wrongOrExpiredCode'});
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
		i18next.changeLanguage(user.language,()=>{
			const dataRequestToken = user.generateDataRequestToken(req.body.format);
			const downloadUrl = `${process.env.SITE_URL}/data-request/${dataRequestToken}`;
			transporter.sendMail({
				from: process.env.SITE_EMAIL_SENDER,
				to: user.email,
				subject: i18next.t('dataRequest'),
				context: {
					title : i18next.t('dataRequest'),
					firstName : user.first_name,
					lastName : user.last_name,
					email: user.email,
					siteName: process.env.SITE_NAME,
					siteUrl: process.env.SITE_URL,
					format: req.body.format,
					downloadUrl: downloadUrl
				},
				attachments : [{
					filename: 'logo.png',
					path: './public/images/logo.png',
					cid: 'logo'
				}],
				template: `data_request_${i18next.language}`,
			},(err,info)=>{
				if (err) console.log(err);
				else {
					res.status(201).json({message: 'downloadLinkSent'});
				}
			});
		})
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/saveLoginDetails',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		/*console.log(user.lastLoginDetails.ip!=null);
		console.log(req.body.loginDetails.ip!==user.lastLoginDetails.ip);
		console.log(user.lastLoginDetails);
		console.log(req.body.loginDetails);*/
		if (user.lastLoginDetails.ip!=null && req.body.loginDetails.ip!==user.lastLoginDetails.ip
			&& user.trustedDevices.filter(device=>device.ip==req.body.loginDetails.ip).length==0){
			i18next.changeLanguage(user.language,()=>{
				const trustDeviceToken = user.generateTrustDeviceToken(req.body.loginDetails);
				const newPasswordToken = user.generateNewPasswordToken();
				const newPasswordUrl = `${process.env.SITE_URL}/new-password/${newPasswordToken}`;
				const trustDeviceUrl = `${process.env.SITE_URL}/trust-device/${trustDeviceToken}`;
				const localeDate = new Date(req.body.loginDetails.date).toLocaleString();
				transporter.sendMail({
					from: process.env.SITE_EMAIL_SENDER,
					to: user.email,
					subject: i18next.t('securityAlert'),
					context: {
						firstName : user.first_name,
						lastName : user.last_name,
						trustDeviceUrl: trustDeviceUrl,
						newPasswordUrl: newPasswordUrl,
						siteName: process.env.SITE_NAME,
						loginDetails: req.body.loginDetails,
						localeDate: localeDate
					},
					attachments : [{
						filename: 'logo.png',
						path: './public/images/logo.png',
						cid: 'logo'
					}],
					template: `security_alert_${i18next.language}`,
				},(err,info)=>{
					if (err) console.log(err);
					else {
						res.status(201).json({message: 'securityAlertSent'});
					}
				});
			})
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
		res.status(200).json({message: 'historyDeleted'});
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

router.get('/getWaitlist',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		res.status(200).json({waitlist: user.waitlist});
	} catch(err) {
		res.status(500).json({message: err.message });
	}
})

router.get('/isGameOnWaitlist/:id',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		const gameOnWaitlist = user.waitlist.filter(item=>item.gameID==req.params.id);
		if (gameOnWaitlist.length>0){
			res.status(200).json({isGameOnWaitlist:gameOnWaitlist[0]});
		} else {
			res.status(200).json({isGameOnWaitlist:false});
		}
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.post('/addToWaitlist',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$addToSet: {waitlist: {
				gameID: req.body.gameID,
				name: req.body.name,
				maxPrice: req.body.maxPrice,
				minDiscount: req.body.minDiscount,
				selectedStores: req.body.selectedStores
			}}},
			{upsert:true,new:true},
			(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else res.json({message: 'addedToTheWaitlist'});
			}
		);
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.put('/editWaitlistItem/:waitlistID',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate(
			{_id: ObjectId(req._id),'waitlist._id': ObjectId(req.params.waitlistID)},
			{$set: {
				'waitlist.$.maxPrice' : req.body.maxPrice,
				'waitlist.$.minDiscount' : req.body.minDiscount,
				'waitlist.$.selectedStores' : req.body.selectedStores
			}},
			(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else res.json({message: 'waitlistItemEdited'});
			}
		);
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.delete('/deleteWaitlistItem/:waitlistID',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate(
			{_id: ObjectId(req._id)},
			{$pull: {'waitlist' : {_id: ObjectId(req.params.waitlistID)}}},
			(err,user)=>{
				if (err) return res.status(400).json({message: err.message});
				else res.json({message: 'waitlistItemDeleted'});
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
		i18next.changeLanguage(user.language,()=>{
			const newPasswordToken = user.generateNewPasswordToken();
			const newPasswordUrl = `${process.env.SITE_URL}/new-password/${newPasswordToken}`;
			transporter.sendMail({
				from: process.env.SITE_EMAIL_SENDER,
				to: req.body.email,
				subject: i18next.t('forgottenPassword'),
				context: {
					firstName: user.first_name,
					lastName: user.last_name,
					newPasswordUrl: newPasswordUrl,
					siteName: process.env.SITE_NAME
				},
				attachments: [{
					name: 'logo.png',
					path: './public/images/logo.png',
					cid: 'logo'
				}],
				template: `forgotten_password_${i18next.language}`
			},(err,info)=>{
				if (err) res.status(400).json({message: err.message});
				else res.status(200).json({message: 'passwordResetLinkSent'})
			})
		})
	} catch(err){
		if (!user){
			return res.status(400).json({message: 'emailNotRegistered'});
		}
		res.status(500).json({message: err.message});
	}
});

router.get('/isResetTokenValid/:token',async(req,res)=>{
	let user;
	try {
		const tokenPayload = await jwt.verify(req.params.token,process.env.NEW_PASSWORD_SECRET);
		user = await User.findOne({
			_id: ObjectId(tokenPayload._id),
			lastPasswordChange: { $lt: new Date(tokenPayload.iat*1000) }
		},(err,doc)=>{
			if (err) console.log(err);
			else if (doc) return res.status(200).json({authorized: true});
			else return res.status(400).json({message: 'linkAlreadyUsed'});
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
		const tokenPayload = await jwt.verify(req.params.token,process.env.NEW_PASSWORD_SECRET);
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
			else return res.status(400).json({message: 'linkAlreadyUsed'});
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.put('/updateUser/:id',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate({_id: ObjectId(req.params.id)},{$set: req.body});
		res.status(200).json({message: 'profileSuccessfullyUpdated'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.put('/deleteProperties/:id',m.isAuthenticated,async(req,res)=>{
	try {
		await User.findOneAndUpdate({_id: ObjectId(req.params.id)},{$unset: req.body});
		res.status(200).json({message: 'profileSuccessfullyUpdated'});
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

router.post('/sendPushNotifications',[m.isAuthenticated,m.isAdmin], (req, res) => {
  const notificationPayload = {
    notification: {
      title: req.body.pushNotificationTitle,
      body: req.body.pushNotificationText,
      icon: 'assets/deal.png',
    },
  }
  console.log(fakeDatabase);
  console.log(notificationPayload);
  
  const promises = []
  fakeDatabase.forEach(subscription => {
    promises.push(
      webpush.sendNotification(subscription,JSON.stringify(notificationPayload))
    )
  })
  //Promise.all(promises).then(() => res.sendStatus(200))
  Promise.all(promises)
  	.then(() => res.status(200).json({message: 'pushNotificationsSent'}))
  	.catch((err)=>{
  		res.status(500).json({message: err.message});
  	});
})			

async function sendWaitlistEmails(){
	try {
		let numberOfEmailsSent = 0;
		const usersWithWaitlist = await User.find({'waitlist.0' : {$exists : true}});
		if (usersWithWaitlist.length > 0) {
			console.log(`${usersWithWaitlist.length} felhasználó várólistájának atnézése folyamatban`);
			usersWithWaitlist.forEach(async(user,i,userArr)=>{
				let games = await loopThroughWaitlist(user);
				console.log(games);
				if (games.length>0){
					if (await wrapedSendMail(user,games)) ++numberOfEmailsSent;
				}
				if (i==userArr.length-1) {
					console.log(`${usersWithWaitlist.length} felhasználó várólistája átnézve`);
					console.log(`Várólistás játék ajánlatok ${numberOfEmailsSent} felhasználónak elküldve`);
			    }
			})
		} else {
			console.log(`Egyik felhasználónak sincs várólistája`);
		}
	} catch(err){
		console.log(err);
	}
}

function wrapedSendMail(user,games){
	return new Promise((resolve,reject)=>{
		i18next.changeLanguage(user.language,()=>{
			transporter.sendMail({
				from: process.env.SITE_EMAIL_SENDER,
				to: user.email,
				subject: i18next.t('waitlist'),
				context: {
					firstName : user.first_name,
					lastName : user.last_name,
					siteName : process.env.SITE_NAME,
					siteUrl: process.env.SITE_URL,
					games: games
				},
				attachments : [{
					filename: 'logo.png',
					path: './public/images/logo.png',
					cid: 'logo'
				}],
				template: `waitlist_${i18next.language}`,
			},(err,info)=>{
				if (err) {
					console.log(err);
					reject(false)
				} else resolve(true);
			});
		})
	})
}

async function loopThroughWaitlist(user){
	return new Promise((resolve,reject)=>{
		let games = [];
		user.waitlist.forEach(async (item,j,waitlistArr)=>{
			await Game.aggregate([
				{$match: {_id: ObjectId(item.gameID),'stores.name': {$in : item.selectedStores}}},
				{$unwind:"$stores"},
				{$match: {
					'stores.expired':false,
					'stores.discountPercent': {$gte : item.minDiscount},
					'stores.specialPrice': {$lte : item.maxPrice}
				}}
			]).exec(function (err, results){
				if(err){
				    return reject(err);
				} else {
					if (results.length>0){

						results.forEach(result=>{
							games.push({
								name : result.name,
								store : result.stores
							});
						})
						
					}
				    if (j==waitlistArr.length-1) resolve(games);
				}
			});
		})
	})
}

router.post('/sendMessages',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		await User.updateMany({},{$push: {messages: {type: req.body.messageType,title: req.body.messageTitle,text: req.body.messageText}}});
		res.status(200).json({message: 'messagesSent'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/messages',m.isAuthenticated,async(req,res)=>{
	try {
		const user = await User.findById(req._id);
		let messagesUnread=0;
		user.messages.forEach(message=>{
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
						return res.status(200).json({messages: 'messagesMarkedAsRead'});
					}
				});
			}
		} else {
			return res.status(200).json({messages: 'messagesNone'});
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
						return res.status(200).json({messages: 'messagesDeleted'});
					}
				});
			}
		} else {
			return res.status(200).json({messages: 'messagesNone'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

function getRecommendedGames(uniqueWatchedGenres){
	return new Promise(async(resolve,reject)=>{
		try {
			await Game.aggregate([
			{$match: {genres: {$in: uniqueWatchedGenres}}},
			{$unwind: '$stores'},
			{$match: {'stores.expired':false}},
			{$sort: {metascore: -1,discountPercent: -1}},
			{$limit: 10}
			]).exec(function(err,results){
				if (err) return reject(err);
				else return resolve(results);
			})
		} catch(err){
			reject(err);
		}
	})
}

router.post('/sendNewsletters',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const usersSubscribedToNewsletter = await User.find({consentToNewsletter: true});
		if (usersSubscribedToNewsletter.length > 0){
			let subject;
			let template;
			usersSubscribedToNewsletter.forEach(async (user,index,userArr)=>{
				i18next.changeLanguage(user.language,async()=>{
					if (req.body.newsletterType==='deals'){
						subject = i18next.t('newsletterDeals');
						template = `newsletter_deals_${i18next.language}`;
					} else {
						subject = `${i18next.t('newsletterOther')+req.body.newsletterTitle}`;
						template = `newsletter_other_${i18next.language}`;
					}

					const unsubscribeToken = user.generateUnsubscribeToken();
					const unsubscribeURL = `${process.env.SITE_URL}/newsletter-unsubscribe/${unsubscribeToken}`;
					let contextObject = {
						firstName: user.first_name,
						lastName: user.last_name,
						title: req.body.newsletterTitle,
						text: req.body.newsletterText,
						unsubscribeURL: unsubscribeURL,
						siteName: process.env.SITE_NAME,
						siteUrl: process.env.SITE_URL
					}

					if (req.body.newsletterType==='deals'){
						let uniqueWatchedGenres=[];
						let idsOfWatchedGames = [];

						user.gameHistory.forEach(game=>{
							idsOfWatchedGames.push(game.gameId);
						})

						const watchedGames = await Game.find({_id: {$in : idsOfWatchedGames}});
						watchedGames.forEach(game=>{
							game.genres.forEach(genre=>{
								if (uniqueWatchedGenres.filter(s=>s.genre==genre).length==0) {
									uniqueWatchedGenres.push(genre);
								}
							})
						})

						const recommendedGames = await getRecommendedGames(uniqueWatchedGenres);

						if (recommendedGames.length>0){
							contextObject.recommendedGames = recommendedGames;
						}
					}

					transporter.sendMail({
						from: process.env.SITE_EMAIL_SENDER,
						to: user.email,
						subject: subject,
						context: contextObject,
						attachments: [{
							name: 'logo.png',
							path: './public/images/logo.png',
							cid: 'logo'
						}],
						template: template
					},(err,info)=>{
						if (err) return res.status(400).json({message: err.message});
						else if (index==userArr.length-1) {
							return res.status(200).json({message: 'newslettersSent'});
						}
					})
				})
			})
		} else {
			return res.status(200).json({message: 'noUserSubscribedToNewsletters'});
		}
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.get('/newsletterUnsubscribe/:token',async(req,res)=>{
	try {
		const user = await jwt.verify(req.params.token,process.env.UNSUBSCRIBE_SECRET);
		await User.findOneAndUpdate({_id: ObjectId(user._id)},{$set : {consentToNewsletter:false}},function(err,doc){
			if (err) return res.status(400).json({message: err.message});
			else return res.status(200).json({message: 'Sikeresen leiratkozott a hírlevélről'});
		})
	} catch(err){
		return res.status(500).json({message: err.message});
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
		res.status(200).json({message: 'profileSuccessfullyDeleted'});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

module.exports = router;
module.exports.deleteUnverifiedUsers = deleteUnverifiedUsers;
module.exports.sendWaitlistEmails = sendWaitlistEmails;