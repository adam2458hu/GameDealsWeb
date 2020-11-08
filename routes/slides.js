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
		const slides = await Slide.find().sort({createdAt: -1});
		res.status(200).json({slides: slides});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/createSlide',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const newSlide = new Slide(req.body.slide);
		await newSlide.save();
		res.status(200).json({message: 'slideCreated'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.put('/editSlide/:id',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		let slide = await Slide.findById(req.params.id);
		slide.title = req.body.slide.title;
		slide.discountPercent = req.body.slide.discountPercent;
		slide.endOfOffer = req.body.slide.endOfOffer;
		slide.image = req.body.slide.image;
		slide.link = req.body.slide.link;
		await slide.save();
		res.status(200).json({message: 'slideEdited'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.delete('/deleteSlide/:id',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const slide = await Slide.findById(req.params.id);
		await slide.remove();
		res.status(200).json({message: 'slideDeleted'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

module.exports = router;