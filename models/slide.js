const mongoose = require('mongoose');
const slideSchema = new mongoose.Schema({
	title : {
		type : String,
		required : true
	},
	discountPercent : {
		type : Number,
		required : true
	},
	link : {
		type : String,
		required : true
	},
	image : {
		type : String,
		required : true
	},
	endOfOffer : {
		type : Date
	}
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('Slide',slideSchema);