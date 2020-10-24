const mongoose = require('mongoose');
const pushSubscriberSchema = new mongoose.Schema({
	endpoint: {
		type: String,
		required: true
	},
  	expirationTime: {
  		type: Number,
  		required: true
  	},
  	keys : {
  		p256dh : {
  			type : String,
  			required: true
  		},
  		auth: {
  			type: String,
  			required: true
  		}
  	}
},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('PushSubscriber',pushSubscriberSchema);