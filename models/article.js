const mongoose = require('mongoose');
const articleSchema = new mongoose.Schema({
	title : [{
		lang : {
			type : String,
			required : true
		},
		text : {
			type : String,
			required : true
		}
	}],
	slug : {
		type : String,
		required : true
	},
	lead : [{
		lang : {
			type : String,
			required : true
		},
		text : {
			type : String,
			required : true
		}
	}],
	body : [{
		lang : {
			type : String,
			required : true
		},
		text : {
			type : String,
			required : true
		}
	}],
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