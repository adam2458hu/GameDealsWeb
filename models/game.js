const mongoose = require('mongoose');
const gameSchema = new mongoose.Schema({
	name : {
		type : String,
		required : true
	},
	genres : [{
		type : String
	}],
	metascore : {
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
		discountPercent : {
			type : Number,
			required : true
		},
		linkToGame : {
			type : String,
			required : true
		},
		image : {
			type : String,
			required : false
		},
		steamID : {
			type : String
		}
	}]
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('Game',gameSchema);