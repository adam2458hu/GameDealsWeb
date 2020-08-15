const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Store = require('../models/store');

router.get('/',async(req,res)=>{
	try {
		const stores = await Store.find();
		res.status(200).json(stores);
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

module.exports = router;