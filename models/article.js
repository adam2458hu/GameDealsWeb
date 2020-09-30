const mongoose = require('mongoose');
const articleSchema = new mongoose.Schema({
	title : {
		type : String,
		required : true
	},
	slug : {
		type : String,
		required : true
	},
	lead : {
		type : String,
		required : true
	},
	body : {
		type : String,
		required : true
	},
	image : {
		type : String,
		required : true
	},
	views : {
		type : Number,
		default : 0
	}
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('Article',articleSchema);