if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const request = require('request');
const Currency = require('../models/currency');

router.get('/',async(req,res)=>{
	try {
		const currencies = await Currency.find().sort('name');
		res.status(200).json(currencies);
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/update',async(req,res)=>{
	try {
		request(process.env.EXCHANGE_RATE_API,function (error, response, body) {
			if (error) {
				console.log(error);
				process.exit(1);
			}
			
			exchangeRates = JSON.parse(response.body);
			Object.keys(exchangeRates.rates).forEach(key=>{
				currency = new Currency({
					name : key,
					rate : exchangeRates.rates[key]
				})

				updateCurrencyInDatabase(currency);
			})
			res.json(exchangeRates);
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

async function updateCurrencyInDatabase(currency){
	try {
		await Currency.findOneAndUpdate(
			{name: currency.name},
			{$set: { rate: currency.rate }},
			{new: true, upsert: true}
		);
	} catch(err){
		console.log(err);
	}
}

module.exports = router;