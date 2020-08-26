const jwt = require('jsonwebtoken');
const User = require('../models/user');

function isTempAuthenticated(req,res,next){
	const authHeader = req.headers['authorization'];
	const tempAccessToken = authHeader.split(' ')[1];
	if (!tempAccessToken) return res.status(403).send('No token provided');
	jwt.verify(tempAccessToken,process.env.TEMP_ACCESS_TOKEN_SECRET,(err,user)=>{
		if (err) return res.sendStatus(403);
		else {
			req._id = user._id;
			next();
		}
	})
}

function isAuthenticated(req,res,next){
	const authHeader = req.headers['authorization'];
	const accessToken = authHeader.split(' ')[1];
	if (!accessToken) return res.status(403).send('No token provided');
	jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
		if (err) return res.sendStatus(403);
		else {
			req._id = user._id;
			next();
		}
	})
}

function isUserRemembered(req,res,next){
	const authHeader = req.headers['authorization'];
	const rememberMeToken = authHeader.split(' ')[1];
	if (!rememberMeToken) return res.status(403).send('No token provided');
	jwt.verify(rememberMeToken,process.env.REMEMBER_ME_SECRET,(err,user)=>{
		if (err) return res.sendStatus(403);
		else {
			req._id = user._id;
			next();
		}
	})
} 

function refreshToken(){
	return async function(req,res,next){
		try {
			const u = await User.findById(req._id);
			const refreshToken = req.body.refreshToken;
			if (refreshToken==null) return res.sendStatus(401);
			jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user)=>{
				if (err) return res.sendStatus(403);
				req.accessToken = u.generateAccessToken();
				next();
			});
		} catch(err){
			res.status(500).json({message: err.message});
		}
	}
}

module.exports.isTempAuthenticated = isTempAuthenticated;
module.exports.isAuthenticated = isAuthenticated;
module.exports.refreshToken = refreshToken;
module.exports.isUserRemembered = isUserRemembered;