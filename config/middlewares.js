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
	//const authHeader = req.headers['authorization'];
	//const rememberMeToken = authHeader.split(' ')[1];
	const rememberMeToken = req.cookies.rememberMeToken;
	if (!rememberMeToken) return res.status(403).send('No token provided');
	jwt.verify(rememberMeToken,process.env.REMEMBER_ME_SECRET,(err,user)=>{
		if (err) return res.sendStatus(403);
		else {
			req._id = user._id;
			next();
		}
	})
} 

async function isAdmin(req,res,next){
	try {
		const user = await User.findById(req._id);
		if (user.role==='admin'){
			next();
		} else {
			return res.status(403).json({message: 'Nincs admin jogosultsága'});
		}
	} catch(err){
		res.status(500).json({message: err.message});
	}
}

function refreshToken(){
	return async function(req,res,next){
		try {
			//const refreshToken = req.body.refreshToken;
			const refreshToken = req.cookies.refreshToken;
			if (refreshToken==null) return res.sendStatus(401);
			jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,async (err,user)=>{
				if (err) return res.sendStatus(403);
				const u = await User.findById(user._id);
				res.cookie('refreshToken',u.generateRefreshToken(),{maxAge: 1000*60*5,httpOnly: true});
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
module.exports.isAdmin = isAdmin;