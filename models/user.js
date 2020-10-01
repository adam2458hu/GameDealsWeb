const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var ValidationError = mongoose.Error.ValidationError;
var ValidatorError  = mongoose.Error.ValidatorError;
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
	language : {
		type : String,
		required : true
	},
	consentToGDPR : {
		type : Boolean,
		required : true,
		default : null
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
		location : {
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
	trustedDevices : [{
		ip : {
			type : String,
			required : true
		},
		country : {
			type: String,
			required: true
		},
		trustedDate : {
			type : Date,
			default : Date.now
		}
	}],
	gameHistory : [{
		gameId : {
			type : String
		},
		date : {
			type : Date,
			default : Date.now
		}
	}],
	waitlist : [{
		gameID : {
			type : String,
			required : true
		},
		name : {
			type : String,
			required : true
		},
		maxPrice : {
			type : Number,
			required : true	
		},
		minDiscount : {
			type : Number,
			required : true	
		},
		selectedStores : [{
			type : String,
			required : true	
		}]
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

userSchema.path('consentToGDPR').validate(function (value) {
    return value===true
  }, 'consentError');

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

userSchema.methods.generateRememberMeToken = function(){
	return jwt.sign({_id: this._id},process.env.REMEMBER_ME_SECRET,{expiresIn: "7d"});
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
	return jwt.sign({_id: this._id},process.env.NEW_PASSWORD_SECRET,{expiresIn: "7d"});
}

userSchema.methods.generateTrustDeviceToken = function(loginDetails){
	return jwt.sign({_id: this._id,ip: loginDetails.ip,country: loginDetails.country},process.env.TRUST_DEVICE_SECRET,{expiresIn: "7d"});
}

userSchema.methods.generateUnsubscribeToken = function(){
	return jwt.sign({_id: this._id},process.env.UNSUBSCRIBE_SECRET,{expiresIn: "5m"});
}

userSchema.methods.verifyToken = function(token){
	return jwt.verify(token,this.secretSalt);
}

module.exports = mongoose.model('User',userSchema);