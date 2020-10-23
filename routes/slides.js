if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;
const Slide = require('../models/slide');
const m = require('../config/middlewares');

router.get('/',async(req,res)=>{
	try {
		const slides = await Slide.find();
		res.status(200).json({slides: slides});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

module.exports = router;