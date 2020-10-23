const mongoose = require('mongoose');
const IGDBGenreSchema = new mongoose.Schema({
	IGDBGenreID : {
		type : Number,
		required: true
	},
	name : {
		type : String,
		required : true
	}
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('Genre',IGDBGenreSchema);