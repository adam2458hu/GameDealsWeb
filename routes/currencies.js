if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const request = require('request');
const Currency = require('../models/currency');

start();

function updateCurrencies(){
	request(process.env.EXCHANGE_RATE_API,function (error, response, body) {
		if (error) {
			console.log(error);
			process.exit(1);
		}

		exchangeRates = JSON.parse(body).rates;
		arrayOfExchangeRates = Object.keys(exchangeRates);
		Object.keys(exchangeRates).forEach(async currencyName=>{
			currency = new Currency({
				name : currencyName,
				rate : exchangeRates[currencyName]
			})

			let updateResponse = await updateCurrencyInDatabase(currency);
			if (updateResponse==='OK' && arrayOfExchangeRates[arrayOfExchangeRates.length-1]===currencyName) {
				console.log("Pénznemek frissítve");
			}
		})
	});
}

function start(){
	var threeHours = 1000*60*60*3;
	updateCurrencies();
	setInterval(updateCurrencies,threeHours);
}

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
			
			exchangeRates = JSON.parse(body).rates;
			arrayOfExchangeRates = Object.keys(exchangeRates);
			Object.keys(exchangeRates).forEach(async currencyName=>{
				currency = new Currency({
					name : currencyName,
					rate : exchangeRates[currencyName]
				})
				
				let updateResponse = await updateCurrencyInDatabase(currency);
				if (updateResponse==='OK' && arrayOfExchangeRates[arrayOfExchangeRates.length-1]===currencyName) {
					console.log("Pénznemek frissítve");
				}
			})
			res.json(JSON.parse(body));
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

async function updateCurrencyInDatabase(currency){
	return new Promise((resolve,reject)=>{
		(async()=>{
			try {
				await Currency.findOneAndUpdate(
					{name: currency.name},
					{$set: { rate: currency.rate }},
					{new: true, upsert: true}
				);
				resolve('OK');
			} catch(err){
				reject(err);
			}
		})();
	})
}

module.exports = router;