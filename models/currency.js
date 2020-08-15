const mongoose = require('mongoose');
const currencySchema = new mongoose.Schema({
	name : {
		type : String,
		required : true
	},
	rate : {
		type : Number,
		required : true
	},
	subCurrency : {
		type : Boolean,
		required: true,
		default: 'true'
	}
})

module.exports = mongoose.model('Currency',currencySchema);