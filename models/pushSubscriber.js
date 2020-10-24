const mongoose = require('mongoose');
const pushSubscriberSchema = new mongoose.Schema({
	deviceID : {
		type : String,
		required : true
	}
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('PushSubscriber',pushSubscriberSchema);