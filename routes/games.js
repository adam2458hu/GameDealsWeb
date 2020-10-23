if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 128;
'use_strict';

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');
const router = express.Router();
const https = require('https');
const request = require('request');
const stringSimilarity = require('string-similarity');
const puppeteer = require('puppeteer');
const Game = require('../models/game');
const Genre = require('../models/genre');
const Currency = require('../models/currency');
const m = require('../config/middlewares');
var appList=[];
var requestStartIndex=32800;
var requestEndIndex=33000;
var stepToNextStore = false;

async function deleteImages(){
	try {
 		let games = await Game.find();
 		games.forEach(async game=>{
 			var storesWithoutImage = [];
 			game.stores.forEach(store=>{
 				storesWithoutImage.push({
 					_id: store._id,
 					name: store.name,
 					originalPrice: store.originalPrice,
 					specialPrice: store.specialPrice,
 					discountPercent: store.discountPercent,
 					linkToGame: store.linkToGame,
 					expired: store.expired,
 					stillOnSale: store.stillOnSale,
 					historicalLowPrice: store.historicalLowPrice
 				})
 			})
 			await Game.findOneAndUpdate({_id: ObjectId(game._id)},{$set: {stores:storesWithoutImage}});
 		});

 		/*User.findOne({}, function(err, user){
			user.key_to_delete = undefined;
		  user.save();
		});*/

 		/*await Game.updateMany({},{$unset : {'stores.$.image':1}},(err,doc)=>{
 			if (err) console.log(err);
 			else console.log(doc);
 		});*/
	} catch(err){
		console.log(err);
	}
}

async function deleteFields(nameArray){
	try {
		let fieldNames={};
		nameArray.forEach(name=>{
			fieldNames[name]=1;
		})
 		await Game.updateMany({},{$unset : fieldNames},{multi: true},(err,doc)=>{
 			if (err) console.log(err);
 			else console.log(doc);
 		});
	} catch(err){
		console.log(err);
	}
}

function requestIGDBAccessToken(){
	var options = {
		method: 'POST',
		url: encodeURI(`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`)
	};

	request(options, async function (error, response, body) {
		//console.log(body);
	});
}

function updateIGDBGenres(){
	var options = {
		method: 'POST',
		url: encodeURI('https://api.igdb.com/v4/genres'),
		headers: {
			'Client-ID': process.env.IGDB_CLIENT_ID,
			'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
			'Accept': 'application/json'
		},
		body : `fields *;`
	};

	request(options, async function (error, response, body) {
		if (body) {
			JSON.parse(body).forEach(async IGDBGenre=>{
				try {
					const genreFound = await Genre.findOne({IGDBGenreID:IGDBGenre.id});
					if (!genreFound) {
						let genre = new Genre({
							IGDBGenreID : IGDBGenre.id,
							name : IGDBGenre.name
						})

						genre.save();
					}
				} catch(err){
					console.log(err);
				}
			})
		}
	});
}

async function appendIGDBGameData(){
	try {
		const gamesWithoutIGDBData=await Game.find({$and: [
			{'cover' : {$exists : false}},
			{'userRating' : {$exists : false}},
			{'criticRating' : {$exists : false}},
			{'totalRating' : {$exists : false}},
			{'description' : {$exists : false}},
			{'releaseDate' : {$exists : false}},
			{'genres' : {$exists : false}}]});
		console.log(gamesWithoutIGDBData.length+' játékhoz IGDB adat keresése folyamatban');
		let startIndex=0;
		let interval = setInterval(()=>{
			if (startIndex>=gamesWithoutIGDBData.length) clearInterval(interval);
			endIndex=startIndex+4;
			for(i=startIndex;i<endIndex && i<gamesWithoutIGDBData.length;i++){
				getIGDBGameData(gamesWithoutIGDBData[i].name);
			}
			startIndex+=4;
		},1000);
	} catch(err){
		console.log(err);
	}
}

function getIGDBGameData(gameName){
	var options = {
		method: 'POST',
		url: encodeURI('https://api.igdb.com/v4/games'),
		headers: {
			'Client-ID': process.env.IGDB_CLIENT_ID,
			'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN}`
		},
		/*body : `query games "Game Info" {
				fields name,cover.url,rating,aggregated_rating,total_rating,summary,first_release_date,genres.name;where slug="${names}";
			};`*/
		body : `fields name,cover.url,rating,aggregated_rating,total_rating,summary,first_release_date,genres.name;search "${gameName.replace(/[^a-zA-Z0-9\s]/g,'')}";`
	};

	request(options, async function (error, response, body) {
		if (body && JSON.parse(body)[0]) {
			var gameData = JSON.parse(body)[0];
			try {

				let IGDBData={};
				if (gameData.cover) IGDBData.cover = gameData.cover.url.replace('thumb','logo_med');
				if (gameData.rating && gameData.rating>=0 && gameData.rating<=100) IGDBData.userRating = gameData.rating;
				if (gameData.aggregated_rating && gameData.aggregated_rating>=0 && gameData.aggregated_rating<=100) IGDBData.criticRating = gameData.aggregated_rating;
				if (gameData.total_rating && gameData.total_rating>=0 && gameData.total_rating<=100) IGDBData.totalRating = gameData.total_rating;
				if (gameData.summary) IGDBData.description = gameData.summary;
				if (gameData.first_release_date) IGDBData.releaseDate = new Date(gameData.first_release_date*1000);
				if (gameData.genres) {
					IGDBData.genres=[];
					gameData.genres.forEach(genre=>{
						IGDBData.genres.push(genre.name);
					})
				}

				await Game.findOneAndUpdate(
					{name: gameName},
					{$set : IGDBData},
					{new: true},(err,game)=>{
						if (err) console.log(err);
						//else console.log(game);
				});
			} catch(err) {
				console.log(err);
			}
		}
	});
}

function getRecommendedGames(uniqueWatchedGenres){
	return new Promise(async(resolve,reject)=>{
		try {
			await Game.aggregate([
			{$match: {genres: {$in: uniqueWatchedGenres}}},
			{$unwind: '$stores'},
			{$match: {'stores.expired':false}},
			{$sort: {totalRating: -1,discountPercent: -1}},
			{$limit: 10}
			]).exec(function(err,results){
				if (err) return reject(err);
				else return resolve(results);
			})
		} catch(err){
			reject(err);
		}
	})
}

router.post('/getRecommendedGames',async(req,res)=>{
	try {
		let uniqueWatchedGenres=[];
		let genreStatistics=[];
		let idsOfWatchedGames = [];

		req.body.gameHistory.forEach(game=>{
			idsOfWatchedGames.push(game.gameId);
		})

		const watchedGames = await Game.find({_id: {$in : idsOfWatchedGames}});
		watchedGames.forEach(game=>{
			game.genres.forEach(genre=>{
				if (genreStatistics.filter(s=>s.genre==genre).length>0) {
					genreStatistics.filter(s=>s.genre==genre)[0].viewCount=
						++genreStatistics.filter(s=>s.genre==genre)[0].viewCount;
				} else {
					genreStatistics.push({genre:genre,viewCount:1});
					uniqueWatchedGenres.push(genre);
				}
			})
		})

		const recommendedGames = await getRecommendedGames(uniqueWatchedGenres);
		
		res.status(200).json({
			recommendedGames: recommendedGames,
			uniqueWatchedGenres: uniqueWatchedGenres,
			genreStatistics: genreStatistics
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.post('/getWatchedGames',async(req,res)=>{
	try {
		let gameIds = [];
		req.body.gameHistory.forEach(game=>{
			gameIds.push(game.gameId);
		})
		gameIds.reverse();

		const watchedGames = await Game.find({_id: {$in : gameIds}});
		let sortedWatchedGames=[];
		gameIds.forEach(id=>{
			sortedWatchedGames.push(watchedGames.filter(game=>game._id==id)[0]);
		})

		res.status(200).json({watchedGames: sortedWatchedGames});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/getGame/:_id',async(req,res)=>{
	try {
		const game = await Game.findOne({_id: ObjectId(req.params._id)});
		res.status(200).json({game: game});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/',async(req,res)=>{
	let filter=getFilter(req);
	let sortObject=getSortObject(req);

	try {
		const totalGamesCount = await Game.countDocuments({'stores.expired':false});
		const filteredGamesCount = await Game.countDocuments(filter);
		//const discountedGames = await Game.find(filter).sort(sortObject).limit(10).skip(parseInt(req.query.gameRequestOffset));
		const unwindedDiscountedGames = await Game.aggregate([
			{$match: {'stores.expired':false}},
			{$unwind:"$stores"},
			{$match: filter},
			{$sort: sortObject},
			{$skip: parseInt(req.query.gameRequestOffset)},
			{$limit:10}
			]).exec(function (err, result){
				if(err){
				    return console.log(err);
				} else {
				    return res.status(200).json({
						totalGamesCount: totalGamesCount,
						filteredGamesCount: filteredGamesCount,
						//discountedGames: discountedGames,
						unwindedDiscountedGames: result
					});
				}
		});/*
		const discountedGames = await Game.find(filter).sort(sortObject).limit(10).skip(parseInt(req.query.gameRequestOffset));
		res.status(200).json({
			totalGamesCount: totalGamesCount,
			filteredGamesCount: filteredGamesCount,
			discountedGames: discountedGames
		});*/
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

router.post('/',[m.isAuthenticated,m.refreshToken()],async(req,res)=>{
	let filter=getFilter(req);
	let sortObject=getSortObject(req);

	try {
		const totalGamesCount = await Game.countDocuments({'stores.expired':false});
		const filteredGamesCount = await Game.countDocuments(filter);
		const unwindedDiscountedGames = await Game.aggregate([
			{$match: filter},
			{$unwind:"$stores"},
			{$match: {'stores.expired':false}},
			{$sort: sortObject},
			{$skip: parseInt(req.query.gameRequestOffset)},
			{$limit:10}
			]).exec(function (err, result){
				if(err){
				    return console.log(err);
				} else {
				    return res.status(200).json({
				    	accessToken: req.accessToken,
						totalGamesCount: totalGamesCount,
						filteredGamesCount: filteredGamesCount,
						//discountedGames: discountedGames,
						unwindedDiscountedGames: result
					});
				}
		});
		/*const discountedGames = await Game.find(filter).sort(sortObject).limit(10).skip(parseInt(req.query.gameRequestOffset));
		res.status(200).json({
			accessToken: req.accessToken,
			totalGamesCount: totalGamesCount,
			filteredGamesCount: filteredGamesCount,
			discountedGames: discountedGames
		});*/
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

function getFilter(req){
	let filter={'stores.expired':false};
	let expressions=[];

	if (req.query.name!=null && req.query.name!=''){
		filter.name = new RegExp(req.query.name,'i');
	}

	if (req.query.selectedStores!=null && req.query.selectedStores!=''){
		storeNames = req.query.selectedStores.split(',');
		for(i=0;i<storeNames.length;i++){
			expressions.push({
				'stores.name' : storeNames[i]
			})
		}

		filter['$or'] = expressions;
	}

	if (req.query.minSpecialPrice!=null && req.query.minSpecialPrice!=''){
		if (filter['stores.specialPrice']){
			filter['stores.specialPrice']['$gte'] = parseInt(req.query.minSpecialPrice);
		} else {
			filter['stores.specialPrice'] = {
				$gte : parseInt(req.query.minSpecialPrice)
			}
		}
	}

	if (req.query.maxSpecialPrice!=null && req.query.maxSpecialPrice!=''){
		if (filter['stores.specialPrice']){
			filter['stores.specialPrice']['$lte'] = parseInt(req.query.maxSpecialPrice);
		} else {
			filter['stores.specialPrice'] = {
				$lte : parseInt(req.query.maxSpecialPrice)
			}
		}
	}

	if (req.query.minOriginalPrice!=null && req.query.minOriginalPrice!=''){
		if (filter['stores.originalPrice']){
			filter['stores.originalPrice']['$gte'] = parseInt(req.query.minOriginalPrice);
		} else {
			filter['stores.originalPrice'] = {
				$gte : parseInt(req.query.minOriginalPrice)
			}
		}
	}

	if (req.query.maxOriginalPrice!=null && req.query.maxOriginalPrice!=''){
		if (filter['stores.originalPrice']){
			filter['stores.originalPrice']['$lte'] = parseInt(req.query.maxOriginalPrice);
		} else {
			filter['stores.originalPrice'] = {
				$lte : parseInt(req.query.maxOriginalPrice)
			}
		}
	}

	if (req.query.minDiscountPercent!=null && req.query.minDiscountPercent!=''){
		if (filter['stores.discountPercent']){
			filter['stores.discountPercent']['$gte'] = parseInt(req.query.minDiscountPercent);
		} else {
			filter['stores.discountPercent'] = {
				$gte : parseInt(req.query.minDiscountPercent)
			}
		}
	}

	if (req.query.maxDiscountPercent!=null && req.query.maxDiscountPercent!=''){
		if (filter['stores.discountPercent']){
			filter['stores.discountPercent']['$lte'] = parseInt(req.query.maxDiscountPercent);
		} else {
			filter['stores.discountPercent'] = {
				$lte : parseInt(req.query.maxDiscountPercent)
			}
		}
	}

	if (req.query.minTotalRating!=null && req.query.minTotalRating!=''){
		if (filter.totalRating){
			filter.totalRating.$lte = parseInt(req.query.minTotalRating);
		} else {
			filter.totalRating={
				$gte : parseInt(req.query.minTotalRating)
			}
		}
	}

	if (req.query.maxTotalRating!=null && req.query.maxTotalRating!=''){
		if (filter.totalRating){
			filter.totalRating.$lte = parseInt(req.query.maxTotalRating);
		} else {
			filter.totalRating={
				$lte : parseInt(req.query.maxTotalRating)
			}
		}
	}

	return filter;
}

function getSortObject(req){
	let sortObject = {};

	if (req.query.sortBy==='specialPrice' || req.query.sortBy==='originalPrice' || 
	 req.query.sortBy==='discountPercent') {
		sortObject['stores.'+req.query.sortBy] = parseInt(req.query.direction);
	} else {
		sortObject[req.query.sortBy] = parseInt(req.query.direction);
	}

	return sortObject;
}

async function getCurrency(name){
	let currency;
	try {
		currency = await Currency.find({name: name});
	} catch(err){
		console.log(err);
	}
	return currency;
}

function checkCurrency(currency,amount){
	return currency=='EUR'?amount*100:amount;
}

function insertHistoricalLowPrices(){
	return new Promise(async(resolve,reject)=>{
		try {
			let games = await Game.find();
			let counter = 0;
			games.forEach(async(game,index,arr)=>{
				for(var i=0;i<game.stores.length;i++){
					game.stores[i].historicalLowPrice = game.stores[i].specialPrice;
					++counter;
				}

				//await saveToDatabase(game);
				await game.save();
				if (index==arr.length-1){
					resolve(counter + ' játék változat árának történelmi mélypontja beillesztve az adatbázisba.');
				}
			}) 
		} catch(err){
			reject(err);
		}
	})
}

function setExpiredPrices(){
	return new Promise(async(resolve,reject)=>{
		try {
			let games = await Game.find({'stores.expired':true});
			let counter = 0;
			games.forEach(async(game,index,arr)=>{
				for(var i=0;i<game.stores.length;i++){
					if (game.stores[i].expired){
						game.stores[i].specialPrice = game.stores[i].originalPrice;
						game.stores[i].discountPercent = 0;
						++counter;
					}
				}
				await game.save();
				if (index==arr.length-1){
					resolve(counter + ' lejárt játék jelenlegi ára korrigálva.');
				}
			})
		} catch(err){
			reject(err);
		}
	})
}

function deleteFalseStoreFields(){
	return new Promsie(async(resolve,reject)=>{
		try {
			let counter = 0;
			let games = await Game.find();
			games.forEach(async (game,index,arr)=>{
				let storesToDeleteByIds = [];
				game.stores.forEach(store=>{
					if (store.historicalLowPrice==store.specialPrice){
						storesToDeleteByIds.push(store._id);
					}
				})

				await Game.findOneAndUpdate({_id: ObjectId(game._id)},{$pull:{'stores': {_id: storesToDeleteByIds}}},(err,doc)=>{
					if (err) reject(err);
					else ++counter;
				})
				if (index==arr.length-1){
					resolve(counter + ' - helytelen árakat tartalmazó - áruház objektum törölve.');
				}
			});
		} catch(err){
			reject(err);
		}
	})
}

async function deleteGamesWithNoStore(){
	return new Promise(async(resolve,reject)=>{
		try {
			let counter = 0;
			let games = await Game.find();
			games.forEach(async game=>{
				if (game.stores.length==0){
					await Game.deleteOne({_id: ObjectId(game._id)},function(err,result){
						if (err) reject(err);
						else ++counter;
					})
				}
				if (index==arr.length-1){
					resolve(counter + ' játék törölve, ami(k)hez nem tartozik ár.');
				}
			})
		} catch(err){
			reject(err);
		}
	});
}

async function resetStillOnSaleFields(storeName){
	let games = await Game.find({'stores.name':storeName});
	games.forEach(async game=>{
		for(var i=0;i<game.stores.length;i++){
			if (game.stores[i].name==storeName && !game.stores[i].expired){
				game.stores[i].stillOnSale = false;
				break;
			}
		}
		await game.save();
	})
}

async function markExpiredDeals(storeName){
	let games = await Game.find({'stores.name':storeName});
	games.forEach(async game=>{
		for(var i=0;i<game.stores.length;i++){
			if (game.stores[i].name==storeName && !game.stores[i].expired && !game.stores[i].stillOnSale){
				game.stores[i].expired = true;
				game.stores[i].specialPrice = game.stores[i].originalPrice;
				game.stores[i].discountPercent = 0;
				break;
			}
		}
		await game.save();
	})
}


function getProxyList(){
	console.log("Proxy lista lekérdezése folyamatban");
	return new Promise((resolve,reject)=>{
		(async()=>{
			try {

				let browser;
				if (process.env.NODE_ENV !== 'production'){
					browser = await puppeteer.launch({'args' : [
					    '--no-sandbox',
					    '--disable-setuid-sandbox'
					]});
				} else {
					/*az executablePath: az AWS Elastic Beanstalkra telepített Chrome miatt kell*/
					browser = await puppeteer.launch({
						executablePath: '/usr/bin/google-chrome-stable',
							'args' : [
						    '--no-sandbox',
						    '--disable-setuid-sandbox'
						]});
				}

				let page = await browser.newPage();
				await page.setDefaultNavigationTimeout(0);
				await page.goto(process.env.PROXY_LIST_URL,{waitUntil: 'networkidle0'});

				//ezekben az országokban a pénznem euró
				const countries = ['Germany','France','Spain','Italy'];
				//https engedélyezve legyen
				await page.select('tfoot .hx select', 'yes');

				let i=0;
				let resolved = false;
				while(!resolved && i<countries.length){
					await page.select('tfoot .hm select', countries[i]);

					let proxys = await page.evaluate(()=>{
						let proxyObjects = [];
						proxyIPs = Array.from(document.querySelectorAll('#proxylisttable_wrapper tbody tr td:nth-child(1):not(.dataTables_empty)'),element=>element.innerHTML);
						proxyPorts = gameCards = Array.from(document.querySelectorAll('#proxylisttable_wrapper tbody tr td:nth-child(2)'),element=>element.innerHTML);

						for(i=0;i<proxyIPs.length;i++){
							proxyObjects.push({
								ip : proxyIPs[i],
								port : proxyPorts[i]
							})
						}
						
						return proxyObjects
					})

					if (proxys.length>0) resolve(proxys);
					else i++;
				}

				if (!resolved) resolve(null);
				
				debugger;

				await browser.close();
			} catch(err){
				reject(err);
			}
		})();
	});
}

function scrapeStore(storeName,storeUrl,useProxy,needsTimeout,multiPage){
	console.log(`${storeName} játékok frissítése folyamatban`);
	return new Promise((resolve,reject)=>{
		(async()=>{
			try {
				// hamisra állítjuk az adatbázisban azokat a mezőket,
				// amik azt jelzik, hogy az adott áruházban az adott játék akciós-e még,
				// és lentebb elvégezzük azt az ellenőrzést ami igazat ad, ha a játék még mindig akciós
				// az áruház honlapján és az adatbázisba már korábban bekerült
				resetStillOnSaleFields(storeName);

				//a proxy szerverrel nem fog működni ha headless módban indítjuk a chromiumot
				let args = [
				    '--no-sandbox',
				    '--disable-setuid-sandbox'
				];
				//a proxy szervert csak fejlesztéskor kell használni, hogy FT helyett €-ban mutassa az árakat
				if (useProxy && process.env.NODE_ENV !== 'production') {
					let proxys = await getProxyList();
					if (proxys!=null) {
						console.log(`Választott proxy: ${proxys[0].ip}:${proxys[0].port}`);
						args.push(`--proxy-server=${proxys[0].ip}:${proxys[0].port}`);
					} else {
						console.log("Nincs megfelelő proxy")
						resolve(`${storeName} játékok frissítése sikertelen`);
					}
				}

				let browser;
				if (process.env.NODE_ENV !== 'production'){
					browser = await puppeteer.launch({'args' : args,ignoreHTTPSErrors: true});
				} else {
					browser = await puppeteer.launch({
						executablePath: '/usr/bin/google-chrome-stable',
						'args' : args,
						ignoreHTTPSErrors: true
					});
				}

				let page = await browser.newPage();
				await page.setDefaultNavigationTimeout(0);
				await page.goto(storeUrl,{waitUntil: 'networkidle0'});

				let scrapedPage;
				if (multiPage){
					scrapedPage = await page.evaluate(()=>{
						let gameUrlList = Array.from(document.querySelectorAll('.menu-item.games.ng-star-inserted storefront-navigation-links:not(.condensed-services-links) a'),element => element.href);

						return {
							gameUrlList
						}
					})
				}

				for(i=0;i<scrapedPage?scrapedPage.gameUrlList.length:1;i++){

					if (multiPage){
						await page.goto(scrapedPage.gameUrlList[i],{waitUntil: 'networkidle2'});
					}
					
					let scrapedGames = await page.evaluate(async({storeName,needsTimeout})=>{
						//ha sokat kell töltenie az oldalnak, akkor várunk 10 mp-et mielőtt
						//elkezdenénk bejárni
						if (needsTimeout){
							//várunk 10 mp-et hogy betöltődjön az oldalon minden script
							await new Promise(function(resolve) { 
						           setTimeout(resolve, 10000)
						    });
						}

						let gameCards;
						let titles = [];
						let originalPrices = [];
						let discountPrices = [];
						let linksToGame = [];

						if (storeName=='Blizzard'){
							gameCards = Array.from(document.querySelectorAll('storefront-browsing-card'),element=>element.innerHTML);
							for(j=0;j<gameCards.length;j++){
								let gameCard = document.createElement("div");
								gameCard.innerHTML = gameCards[j];
								let title = gameCard.querySelector('.name');
								let originalPrice = gameCard.querySelector('.name~.price .full');
								let discountPrice = gameCard.querySelector('.name~.price .discount');
								let linkToGame = gameCard.querySelector('a');

								if (discountPrice) {
									titles.push(title.innerText.replace('®',''));
									discountPrices.push(discountPrice.innerText);
									originalPrices.push(originalPrice.innerText);
									linksToGame.push(linkToGame.href);
								}
							}
						} else if (storeName=='Epic Games Store'){
							gameCards = Array.from(document.querySelectorAll(`[data-component="CatalogItemOfferCard"]`),element=>element.innerHTML);
							for(i=0;i<gameCards.length;i++){
								let gameCard = document.createElement("div");
								gameCard.innerHTML = gameCards[i];
								let originalPrice = gameCard.querySelector('[data-component="Price"]');

								if (gameCard.querySelector('[class*="Price__discount"]')) {
									let title = gameCard.querySelector('[data-component="OfferTitleInfo"]');
									let discountPrice = originalPrice.nextSibling;
									let linkToGame = gameCard.querySelector('a');

									titles.push(title.innerText.replace('®',''));
									discountPrices.push(discountPrice.innerText.replace('Free','€0'));
									originalPrices.push(originalPrice.innerText);
									linksToGame.push(linkToGame.href);
								}
							}
						}

						//€ jel levágása
						for(j=0;j<discountPrices.length;j++){
							originalPrices[j] = originalPrices[j].substring(1,originalPrices[j].length);
							discountPrices[j] = discountPrices[j].substring(1,discountPrices[j].length);
						}

						if (!discountPrices.length) return null;
						else return {
							titles,
							discountPrices,
							originalPrices,
							linksToGame
						}
					},{storeName,needsTimeout})

					if (await checkScrapedGames(storeName,scrapedGames,multiPage?i==scrapedPage.gameUrlList.length-1:true)) {
						markExpiredDeals(storeName);
						resolve(`${storeName} játékok frissítve`);
					}
				}
				debugger;

				await browser.close();
			} catch(err){
				reject(err);
			}
		})();
	})
}

//Megvizsgálja az adott áruház, adott oldalán talált akciós játékait, amit
//a gameObjects tömbben adunk át. A storeName az adott áruház neve, a lastPage
//pedig azt jelzi, hogy az utolsó oldalon vagyunk-e
function checkScrapedGames(storeName,scrapedGames,lastPage){
	return new Promise((resolve,reject)=>{
		if (scrapedGames) {
			let gameObjects = [];
			for(var j=0;j<scrapedGames.titles.length;j++){
				gameObjects.push({
					title : scrapedGames.titles[j],
					discountPrice : scrapedGames.discountPrices[j],
					originalPrice : scrapedGames.originalPrices[j],
					linkToGame : scrapedGames.linksToGame[j]
				})
			}

			gameObjects.forEach(async (game,index,arr)=>{
				try {
					let gameFoundInDatabase = await Game.findOne({name: game.title});

					//ha az adott játék még nem szerepel az adatbázisban, és az eredeti ára fél €-tól több
					//(személyes preferencia, hogy pár forintos játék ne szerepeljen benne)
					//akkor megnézzük, hogy tartozik e hozzá metacritic adat, 
					//(hogy a honlap találati listájában a játékokat ez alapján rangsorolni tudjuk,)
					//és azt hozzáfűzve beillesztjük az adatbázisba.
					if (!gameFoundInDatabase && game.originalPrice>0.5) {
						const newGame = new Game({
							name : game.title
						})

						newGame.stores.push({
							name : storeName,
							originalPrice : game.originalPrice,
							specialPrice : game.discountPrice,
							historicalLowPrice : game.discountPrice,
							discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
							linkToGame : game.linkToGame,
							expired : false,
							stillOnSale : true
						})

						await newGame.save();
					} else if (gameFoundInDatabase){
						//ha az adatbázisban található játékhoz már szerepel az adott áruházból
						//származó ár
						if (gameFoundInDatabase.stores.filter(function(store){
							return store.name==storeName; }).length > 0) {
							let gameStillOnSale = await Game.findOne({
								name: game.title,
								$and:[
									{'stores.name':storeName},
									{'stores.specialPrice':game.discountPrice},
									{'stores.expired':false}
								]
							});

							//ha a játék még akciós, akkor
							//frissítjük a játék stillOnSale mezőjét, ami az adott
							//áruházhoz tartozik
							if (gameStillOnSale){
								gameStillOnSale.stores.forEach(store=>{
									if (store.name==storeName){
										store.stillOnSale = true;
									}
								});

								await gameStillOnSale.save();
							} else {
								//ha az előző akciós ár lejárt vagy eltérő a jelenlegi akciós ártól,
								//akkor a korábbi adatokat felül írjuk
								gameFoundInDatabase.stores.forEach(store=>{
									if (store.name==storeName){
										store.originalPrice = game.originalPrice;
										store.specialPrice = game.discountPrice;
										store.discountPercent = Math.round((1-(game.discountPrice/game.originalPrice))*100);
										store.linkToGame = game.linkToGame;
										store.expired = false;
										store.stillOnSale = true;
									}
									if (game.discountPrice<store.historicalLowPrice){
										store.historicalLowPrice=game.discountPrice;
									}
								})

								await gameFoundInDatabase.save();
							}
						} else {
							//ha az adott nevű áruháztól még nem tartozott eddig adat a játékhoz,
							//akkor azt hozzáfűzzük az adatbázisban a játékhoz
							gameFoundInDatabase.stores.push({
								name : storeName,
								originalPrice : game.originalPrice,
								specialPrice : game.discountPrice,
								historicalLowPrice : game.discountPrice,
								discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
								linkToGame : game.linkToGame,
								expired : false,
								stillOnSale : true
							})

							await gameFoundInDatabase.save();
						}
					}
					
					//ha a játék objektumok közül az utolsót is megvizsgáltuk, ami
					//az utolsó áruházi oldalon található, tehát végignéztük
					//az áruház összes akciós játékát, akkor igazat adunk vissza,
					//egyébként hamisat
					if (index==arr.length-1){
						if (lastPage) resolve(true);
						else resolve(false);
					}
				} catch(err){
					reject(err);
				}
			})
		} else if (lastPage) {
			resolve(true);
		} else {
			resolve(false);
		}
	})
}

function requestGameList(store){
	console.log(store.name + ' játékok frissítése folyamatban');
	return new Promise((resolve,reject)=>{
		resetStillOnSaleFields(store.name);

		request(store.gameListUrl,function(error,response,body){
			if (error) {
				reject(error);
				process.exit(1);
			}

			let totalPages = JSON.parse(body)[`${store.totalPagesField}`];
			let maxIteration=Math.floor(totalPages/store.maxRequests);
			for(let iteration=0;iteration<=maxIteration;iteration++){
				let currentIteration = iteration;
				setTimeout(()=>{
					let fromPageIndex=currentIteration*store.maxRequests;
					let toPageIndex=(currentIteration*store.maxRequests+store.maxRequests);

					for(page=fromPageIndex;page<totalPages && page<toPageIndex;page++){
						let currentPageIndex=page;
										
						request(store.gameListUrl+`&page=${page + store.gameListUrlQueryOffset}`,function(error,response,body){
							if (error) {
								reject(error);
								process.exit(1);
							}

							gameList = JSON.parse(body)[`${store.gameArrayField}`];
							gameList.forEach(async (game,index,arr)=>{
								try {
									
									let originalPrice=game[`${store.fieldsToOriginalPrice[0]}`];
									let specialPrice=game[`${store.fieldsToSpecialPrice[0]}`];
									for(let i=0;i<store.fieldsToOriginalPrice.length-1;i++){
										originalPrice = originalPrice[`${store.fieldsToOriginalPrice[i+1]}`]
										specialPrice = specialPrice[`${store.fieldsToSpecialPrice[i+1]}`];
									}

									if (originalPrice==specialPrice){
										if (currentPageIndex==totalPages-1 && index==arr.length-1) {
											markExpiredDeals(store.name);
											resolve(`${store.name} játékok frissítve`);
										}
										return;
									}

									let gameFoundInDatabase = await Game.findOne({name: game[`${store.gameTitleField}`]});
									if (!gameFoundInDatabase && originalPrice>0.5) {
										let newGame = new Game({
											name : game[`${store.gameTitleField}`]
										})
										if (store.genresField) {
											newGame.genres = game[`${store.genresField}`];
										}

										saveNewStore(newGame,store,game,originalPrice,specialPrice);

										if (currentPageIndex==totalPages-1 && index==arr.length-1){
											markExpiredDeals(store.name);
											resolve(`${store.name} játékok frissítése befejezve`);
										} else if (currentPageIndex==toPageIndex-1 && index==arr.length-1) {
											console.log(`${store.name}`+' játékok átnézve: '+toPageIndex+'/'+totalPages+' oldal');
										}
									} else if (gameFoundInDatabase){

										if (gameFoundInDatabase.stores.filter(function(s){
										return s.name==store.name; }).length > 0) {
											let gameStillOnSale = await Game.findOne({
												name: game[`${store.gameTitleField}`],
												$and:[
													{'stores.name':store.name},
													{'stores.specialPrice':specialPrice},
													{'stores.expired':false}
												]
											});
											//ha a játék szerepel az adatbázisban és még akciós, akkor rögzítjük
											//az adatbázisban hogy még akciós, amit azért kell, hogy az iteráció végén
											//ne állítjuk az akciót lejártra.
											if (gameStillOnSale){
												gameStillOnSale.stores.forEach(s=>{
													if (s.name==store.name){
														s.stillOnSale = true;
														s.linkToGame = store.url+game[`${store.gameUrlField}`];
													}
												});

												await gameStillOnSale.save();
											} else {
												//ha a játék már szerepel az adatbázisban és az előző akciós ár lejárt
												//vagy eltérő a jelenlegi akciós ártól, akkor a korábbi adatokat
												//felül írjuk
												gameFoundInDatabase.stores.forEach(s=>{
													if (s.name==store.name){
														s.originalPrice = originalPrice;
														s.specialPrice = specialPrice;
														s.discountPercent = Math.round((1-((specialPrice)/(originalPrice)))*100);
														s.linkToGame = store.url+game[`${store.gameUrlField}`];
														s.expired = false;
														s.stillOnSale = true;
													}
													if (specialPrice<store.historicalLowPrice){
														s.historicalLowPrice=specialPrice;
													}
												})

												await gameFoundInDatabase.save();
											}
										} else {
											saveNewStore(gameFoundInDatabase,store,game,originalPrice,specialPrice);
										}

										//ha a lekérdezett játékok közül az utolsót is megvizsgáltuk
										if (currentPageIndex==totalPages-1 && index==arr.length-1){
											markExpiredDeals(store.name);
											resolve(`${store.name} játékok frissítve`);
										} else if (currentPageIndex==toPageIndex-1 && index==arr.length-1) {
											console.log(`${store.name}`+' játékok átnézve: '+toPageIndex+'/'+totalPages+' oldal');
										}
									}
								} catch(err){
									reject(err);
								}
							})
						});
					}
				},35000*currentIteration);
			}
		});
	})
}

async function saveNewStore(gameInstance,store,game,originalPrice,specialPrice){
	//a még nem rögzített áruházban szereplő játék adatait tartalmazó objektum
	let newStore = {
		name : store.name,
		originalPrice : originalPrice,
		specialPrice : specialPrice,
		historicalLowPrice : specialPrice,
		discountPercent : Math.round((1-((specialPrice)/(originalPrice)))*100),
		linkToGame : store.url+game[`${store.gameUrlField}`],
		expired : false,
		stillOnSale : true
	};
	gameInstance.stores.push(newStore);

	await gameInstance.save();	
}

function refreshSteamGames(callback){
	request(process.env.STEAM_APPS_URL, function (error, response, body) {
		if (error) {
			console.log(error);
			process.exit(1);
		}

		appList = JSON.parse(response.body).applist.apps;
		setInterval(callback,30000);
	});
}

function printOutIP(){		
	const { networkInterfaces } = require('os');
	const nets = networkInterfaces();
	const results = {} // or just '{}', an empty object

	for (const name of Object.keys(nets)) {
	    for (const net of nets[name]) {
	        // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
	        if (net.family === 'IPv4' && !net.internal) {
	            if (!results[name]) {
	                results[name] = [];
	            }

	            results[name].push(net.address);
	        }
	    }
	}
	console.log(results);
}

async function refreshGames() {
	try {
		let response;
		//deleteFields(['genres','userRating','description','releaseDate']);
		//deleteImages();
		//updateIGDBGenres();
		//appendIGDBGameData();
		/*response = await insertHistoricalLowPrices();
		console.log(response);
		response = await setExpiredPrices();
		console.log(response);
		response = await deleteFalseStoreFields();
		console.log(response);
		response = await deleteGamesWithNoStore();
		console.log(response);*/
		/*
		response = await scrapeStore('Blizzard',process.env.BLIZZARD_GAMES_URL,false,false,true);
		console.log(response);*//*
		response = await scrapeStore('Epic Games Store',process.env.EPIC_GAMES_ALL_GAMES_URL,true,true,false);
		console.log(response);*//*
		response = await requestGameList({
			name : 'Humble Bundle',
			url : process.env.HUMBLE_BUNDLE_URL,
			gameListUrl : process.env.HUMBLE_BUNDLE_DISCOUNTED_GAMES_URL,
			gameListUrlQueryOffset : 0,
			totalPagesField : 'num_pages',
			gameUrlField : 'human_url',
			gameArrayField : 'results',
			gameTitleField : 'human_name',
			fieldsToOriginalPrice : ['full_price','amount'],
			fieldsToSpecialPrice : ['current_price','amount'],
			maxRequests : 20,
		});
		console.log(response);
		response = await requestGameList({
			name : 'GoG',
			url : process.env.GOG_URL,
			gameListUrl : process.env.GOG_DISCOUNTED_GAMES_URL,
			gameListUrlQueryOffset : 1,
			totalPagesField : 'totalPages',
			gameUrlField : 'url',
			gameArrayField : 'products',
			gameTitleField : 'title',
			genresField : 'genres',
			fieldsToOriginalPrice : ['price','baseAmount'],
			fieldsToSpecialPrice : ['price','finalAmount'],
			maxRequests : 1000,
		});
		console.log(response);*/
	} catch(err){
		console.log(err);
	}
}

function getGameDetails(){
	//lekérdezendő játékok azonosítójából álló lista
	let queryParams='';

	for(let i=requestStartIndex;i<requestEndIndex;i++){
		if (appList[i].appid){
			if (i<requestEndIndex-1){
				queryParams=queryParams+appList[i].appid+',';
			} else {
				queryParams=queryParams+appList[i].appid;
			} 
		}
	}

	//csak a price_overview szűrővel együtt működik a lekérdezés
	request(process.env.STEAM_APP_DETAILS_URL+queryParams+'&filters=price_overview', function (error, response, body) {
		if (error) {
			console.log(error);
			process.exit(1);
			//return res.status(500).json({message: err.message});
		}

		const resp = JSON.parse(response.body);
		Object.keys(resp).forEach(async id=>{
			const appData = resp[id];
			if (appData.success){
				if (appData.data.price_overview && appData.data.price_overview.discount_percent!=0){
					const discountedGame = new Game({
						name: ''
					});

					appList.forEach(app=>{
						if (app.appid==id){
							discountedGame.name = app.name;
						}
					})

					discountedGame.stores.push({
						name : 'Steam',
						originalPrice : appData.data.price_overview.initial/100,
						specialPrice : appData.data.price_overview.final/100,
						historicalLowPrice : appData.data.price_overview.final/100,
						discountPercent : appData.data.price_overview.discount_percent,
						linkToGame : process.env.STEAM_APP_LINK_URL+parseInt(id),
						steamID : id
					})

					await discountedGame.save();
				}
			}
		})

		console.log(`Átnézett játékok száma: ${requestEndIndex}`);
		requestStartIndex+=200;
		requestEndIndex+=200;
		//return res.status(response.statusCode).json(discountedGames);
	});
}

function IsValidDate(d){
	return !isNaN(Date.parse(d));
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

module.exports = router;
module.exports.refreshGames = refreshGames;