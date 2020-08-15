const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
	role : {
		type : String,
		required : true,
		default : 'user'
	},
	first_name : {
		type : String,
		required : true
	},
	last_name : {
		type : String,
		required : true
	},
	email : {
		type : String,
		required : true,
		unique : true
	},
	password : {
		type : String,
		required : true,
		minlength : [8,'A jelszónak minimum 8 karakterből kell álnia']
	},
	emailVerified : {
		type : Boolean,
		default : false
	},
	secretSalt : {
		type : String
	},
	consentToGDPR : {
		type : Boolean,
		default : false
	},
	consentToNewsletter : {
		type : Boolean,
		default : false
	},
	twoFactorGoogleSecret : {
		type : String
	},
	twoFactorEmailSecret : {
		type : String
	},
	twoFactorTempSecret : {
		type : String
	},
	twoFactorGoogleEnabled : {
		type : Boolean,
		default : false
	},
	twoFactorEmailEnabled : {
		type : Boolean,
		default : false
	},
	lastPasswordChange : {
		type : Date,
		default : Date.now
	},
	lastLoginDetails : {
		ip : {
			type: String
		},
		date : {
			type : Date
		},
		userAgent: {
			type : String
		},
		os: {
			type : String
		},
		browser: {
			type : String
		},
		device: {
			type : String
		},
		os_version: {
			type : String
		},
		browser_version: {
			type : String
		},
		windowWidth: {
			type : Number
		},
		windowHeight: {
			type : Number
		}

	},
	gameHistory : [{
		gameId : {
			type : String
		},
		date : {
			type : Date,
			default : Date.now
		}
	}],
	messages : [{
		date : {
			type : Date,
			default : Date.now
		},
		type : {
			type : String
		},
		title : {
			type : String
		},
		text : {
			type : String
		},
		read : {
			type : Boolean,
			default : false
		}
	}]
},	{
	timestamps: true
});

userSchema.pre('save',async function(next){
	try {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(this.password,salt);
		this.password = hashedPassword;
		this.secretSalt = salt;
		next();
	} catch (err){
		next(err);
	}
})

userSchema.pre('findOneAndUpdate',async function(next){
	try {
		if (this._update.$set.password){
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(this._update.$set.password,salt);
			this._update.$set.password = hashedPassword;
			this._update.$set.secretSalt = salt;
		}
		next();
	} catch (err){
		next(err);
	}
})

userSchema.methods.generateAccessToken = function(){
	return jwt.sign({_id: this._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn: "5m"});
}

userSchema.methods.generateTempAccessToken = function(){
	return jwt.sign({_id: this._id},process.env.TEMP_ACCESS_TOKEN_SECRET,{expiresIn: "5m"});
}

userSchema.methods.generateRefreshToken = function(){
	return jwt.sign({_id: this._id},process.env.REFRESH_TOKEN_SECRET);
}

userSchema.methods.generateEmailToken = function(){
	return jwt.sign({_id: this._id},process.env.EMAIL_SECRET,{expiresIn: "5m"});
}

userSchema.methods.generateDataRequestToken = function(format){
	return jwt.sign({_id: this._id,format: format},process.env.DATA_REQUEST_TOKEN,{expiresIn: "5m"});
}

userSchema.methods.verifyEmailToken = function(token){
	return jwt.verify(token,process.env.EMAIL_SECRET);
}

userSchema.methods.generateForgottenToken = function(){
	return jwt.sign({_id: this._id},process.env.FORGOTTEN_SECRET,{expiresIn: "5m"});
}

userSchema.methods.generateNewPasswordToken = function(){
	return jwt.sign({_id: this._id},process.env.NEW_PASSWORD_SECRET,{expiresIn: "5m"});
}

userSchema.methods.generateSecurityAlertToken = function(){
	return jwt.sign({_id: this._id},process.env.SECURITY_ALERT_SECRET,{expiresIn: "5m"});
}

userSchema.methods.verifyToken = function(token){
	return jwt.verify(token,this.secretSalt);
}

module.exports = mongoose.model('User',userSchema);