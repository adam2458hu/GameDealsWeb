const mongoose = require('mongoose');
const gameSchema = new mongoose.Schema({
	name : {
		type : String,
		required : true
	},
	cover : {
		type : String
	},
	genres : [{
		type : String
	}],
	userRating : {
		type : Number
	},
	criticRating : {
		type : Number
	},
	totalRating : {
		type : Number
	},
	releaseDate : {
		type : Date
	},
	description : {
		type : String
	},
	stores : [{
		name : {
			type : String,
			required : true
		},
		originalPrice : {
			type : Number,
			required : true
		},
		specialPrice : {
			type : Number,
			required : true
		},
		historicalLowPrice : {
			type : Number,
			required : true
		},
		discountPercent : {
			type : Number,
			required : true
		},
		linkToGame : {
			type : String,
			required : true
		},
		steamID : {
			type : String
		},
		expired : {
			type : Boolean,
			required : true
		},
		stillOnSale : {
			type : Boolean,
			required : true
		}
	}]
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('Game',gameSchema);