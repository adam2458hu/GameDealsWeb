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
const puppeteer = require('puppeteer');
const Game = require('../models/game');
const Genre = require('../models/genre');
const Currency = require('../models/currency');
const m = require('../config/middlewares');
var appList=[];
var automaticRefreshInterval;
var refreshInterval;
var currentRefreshType;
var currentlyBeingRefreshed;
var refreshState='stopped';
var storesToRefresh=['GoG'];
var IGDBAccessToken = process.env.IGDB_ACCESS_TOKEN;
var IGDBAccessTokenIssuedAt;
var IGDBAccessTokenExpiresAt;
var refreshIGDBData;
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
	return new Promise((resolve,reject)=>{
		var options = {
			method: 'POST',
			url: encodeURI(`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`)
		};

		request(options, async function (error, response, body) {
			if (error){
				reject(error);
			} else {
				resolve(body);
			}
		});
	})
}

router.get('/getIGDBAccessToken',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		res.status(200).json({
			IGDBAccessToken: IGDBAccessToken,
			IGDBAccessTokenExpiresAt: IGDBAccessTokenExpiresAt
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/requestIGDBAccessToken',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const response = JSON.parse(await requestIGDBAccessToken()); 
		IGDBAccessToken = response.access_token;
		IGDBAccessTokenIssuedAt = new Date();
		IGDBAccessTokenExpiresAt = new Date(new Date().getTime()+response.expires_in*1000);

		res.status(200).json({
			message: 'Sikeres IGDB hozzáférési token igénylés',
			IGDBAccessToken: IGDBAccessToken,
			IGDBAccessTokenExpiresAt: IGDBAccessTokenExpiresAt
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

function updateIGDBGenres(){
	var options = {
		method: 'POST',
		url: encodeURI('https://api.igdb.com/v4/genres'),
		headers: {
			'Client-ID': process.env.IGDB_CLIENT_ID,
			'Authorization': `Bearer ${IGDBAccessToken}`,
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
	currentlyBeingRefreshed = 'IGDB adatok frissítése folyamatban';
	console.log(currentlyBeingRefreshed);
	return new Promise(async(resolve,reject)=>{
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
			let endIndex=4;
			let interval = setInterval(()=>{
				if (refreshState==='stopped') {
					clearInterval(interval);
					reject('IGDB adatok keresése leállítva');
					return;
				} else if (startIndex<gamesWithoutIGDBData.length) {
					for(let i=startIndex;i<endIndex && i<gamesWithoutIGDBData.length;i++){
						getIGDBGameData(gamesWithoutIGDBData[i].name);

						//ha a lekérdezett játékok közül az utolsót is megvizsgáltuk
						if (i==gamesWithoutIGDBData.length-1){
							clearInterval(interval);
							resolve('IGDB adatok lekérdezve');
							return;
						} else if (i==endIndex-1 && endIndex%20==0) {
							currentlyBeingRefreshed = 'IGDB adatok lekérdezve: '+endIndex+'/'+gamesWithoutIGDBData.length+' játékhoz';
							console.log(currentlyBeingRefreshed);
						}
					}
					startIndex+=4;
					endIndex=startIndex+4;
				} else {
					clearInterval(interval);
				}
			},1000);
		} catch(err){
			reject(err);
		}
	})
}

function getIGDBGameData(gameName){
	var options = {
		method: 'POST',
		url: encodeURI('https://api.igdb.com/v4/games'),
		headers: {
			'Client-ID': process.env.IGDB_CLIENT_ID,
			'Authorization': `Bearer ${IGDBAccessToken}`
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
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

//router.post('/',[m.isAuthenticated,m.refreshToken()],async(req,res)=>{
router.get('/',m.isAuthenticated,async(req,res)=>{
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
						unwindedDiscountedGames: result
					});
				}
		});
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

function markExpiredDeals(storeName){
	return new Promise(async(resolve,reject)=>{
		let games = await Game.find({'stores.name':storeName});
		games.forEach(async (game,index,arr)=>{
			for(var i=0;i<game.stores.length;i++){
				if (game.stores[i].name==storeName && !game.stores[i].expired && !game.stores[i].stillOnSale){
					game.stores[i].expired = true;
					game.stores[i].specialPrice = game.stores[i].originalPrice;
					game.stores[i].discountPercent = 0;
					break;
				}
			}
			
			await game.save();
			if (index==arr.length-1) resolve('ok');
		})
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
	currentlyBeingRefreshed = `${storeName} játékok frissítése folyamatban`;
	console.log(currentlyBeingRefreshed);
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

				for(i=0;i<(scrapedPage?scrapedPage.gameUrlList.length:1);i++){

					if (multiPage){
						//ha az admin megállította a frissítést, akkor az aktuális oldalt már nem vizsgáljuk
						if (refreshState==='stopped') {
							reject(storeName + ' játékok frissítése leállítva');
							return;
						}
						currentlyBeingRefreshed = `${storeName} játékok átnézve: `+(i+1)+'/'+scrapedPage.gameUrlList.length+' oldal';
						console.log(currentlyBeingRefreshed);
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

					/*if (await checkScrapedGames(storeName,scrapedGames,multiPage?i==scrapedPage.gameUrlList.length-1:true)) {
						setTimeout(async()=>{
							await markExpiredDeals(store.name);
							resolve(`${store.name} játékok frissítve`);
						},1000);
					}*/
					let scrapedGamesChecked = await checkScrapedGames(storeName,scrapedGames,multiPage?i==scrapedPage.gameUrlList.length-1:true);
					if (scrapedGamesChecked===true) {
						setTimeout(async()=>{
							await markExpiredDeals(storeName);
							resolve(`${storeName} játékok frissítve`);
						},1000);
					} else if (scrapedGamesChecked==='stopped'){
						reject(storeName + ' játékok frissítése leállítva');
						return;
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
				if (refreshState==='stopped') {
					reject('stopped');
					return;
				}

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
	currentlyBeingRefreshed = store.name + ' játékok frissítése folyamatban';
	console.log(currentlyBeingRefreshed);
	return new Promise((resolve,reject)=>{
		resetStillOnSaleFields(store.name);

		request(store.gameListUrl,function(error,response,body){
			if (error) {
				reject(error);
				process.exit(1);
			}

			let fromPageIndex=0;
			let totalPages = JSON.parse(body)[`${store.totalPagesField}`];
			let interval = setInterval(()=>{
				if (refreshState==='stopped') {
					clearInterval(interval);
					reject(store.name + ' játékok frissítése leállítva');
					return;
				} else if (fromPageIndex>=totalPages) clearInterval(interval);
				let toPageIndex=fromPageIndex+4;

				for(page=fromPageIndex;page<totalPages && page<toPageIndex;page++){
					let currentPageIndex=page;	
					request(store.gameListUrl+`&page=${page + store.gameListUrlQueryOffset}`,function(error,response,body){
						if (error) {
							reject(error);
							process.exit(1);
						}

						gameList = JSON.parse(body)[`${store.gameArrayField}`];
						gameList.forEach(async (game,index,arr)=>{
							if (refreshState==='stopped') {
								clearInterval(interval);
								reject(store.name + ' játékok frissítése leállítva');
								return;
							}

							try {
								
								let originalPrice=game[`${store.fieldsToOriginalPrice[0]}`];
								let specialPrice=game[`${store.fieldsToSpecialPrice[0]}`];
								for(let i=0;i<store.fieldsToOriginalPrice.length-1;i++){
									originalPrice = originalPrice[`${store.fieldsToOriginalPrice[i+1]}`]
									specialPrice = specialPrice[`${store.fieldsToSpecialPrice[i+1]}`];
								}

								if (originalPrice==specialPrice){
									if (currentPageIndex==totalPages-1 && index==arr.length-1) {
										//ha az utolsó játékot is végignéztük, akkor kis várakozás után kilépés.
										//ha nem várunk, akkor hiába van az await saveNewStore(..), nem várja meg amíg minden játék
										//az adatbázisba kerül és úgy lépne tovább a programkód
										setTimeout(async()=>{
											await markExpiredDeals(store.name);
											resolve(`${store.name} játékok frissítve`);
										},1000);
									}
									return;
								}

								let gameFoundInDatabase = await Game.findOne({name: game[`${store.gameTitleField}`]});
								if (!gameFoundInDatabase && originalPrice>0.5) {
									let newGame = new Game({
										name : game[`${store.gameTitleField}`]
									})

									await saveNewStore(newGame,store,game,originalPrice,specialPrice);
									
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
									} else await saveNewStore(gameFoundInDatabase,store,game,originalPrice,specialPrice);
								}

								//ha a lekérdezett játékok közül az utolsót is megvizsgáltuk
								if (currentPageIndex==totalPages-1 && index==arr.length-1){
									setTimeout(async()=>{
										await markExpiredDeals(store.name);
										resolve(`${store.name} játékok frissítve`);
									},1000);
								} else if (currentPageIndex==toPageIndex-1 && index==arr.length-1) {
									currentlyBeingRefreshed = `${store.name}`+' játékok átnézve: '+toPageIndex+'/'+totalPages+' oldal';
									console.log(currentlyBeingRefreshed);
								}
							} catch(err){
								reject(err);
							}
						})
					});
				}

				fromPageIndex+=4;
			},1000);
		});
	})
}

async function saveNewStore(gameInstance,store,game,originalPrice,specialPrice){
	return new Promise(async(resolve,reject)=>{
		try {
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
			resolve('játék mentve az adatbázisba');
		} catch(err){
			reject(err);
		}
	});
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

async function refreshGames() {
	refreshState='running';
	console.log('----------------');
	console.log('A játékok frissítése folyamatban:');
	console.log('Frissítés módja: '+currentRefreshType);
	if (refreshInterval) console.log('Frissítés intervalluma: '+refreshInterval);
	console.log('Frissítendő áruházak: '+storesToRefresh);
	console.log('IGDB adatok frissítése: '+refreshIGDBData);
	console.log('----------------');
	try {
		let response;
		
		if (storesToRefresh.includes('Blizzard')) {
			response = await scrapeStore('Blizzard',process.env.BLIZZARD_GAMES_URL,false,false,true);
			console.log(response);
			if (refreshState==='stopped') return;
		}

		if (storesToRefresh.includes('Epic Games Store')) {
			response = await scrapeStore('Epic Games Store',process.env.EPIC_GAMES_ALL_GAMES_URL,true,true,false);
			console.log(response);
			if (refreshState==='stopped') return;
		}

		if (storesToRefresh.includes('Humble Bundle')) {
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
			if (refreshState==='stopped') return;
		}

		if (storesToRefresh.includes('GoG')) {
			response = await requestGameList({
				name : 'GoG',
				url : process.env.GOG_URL,
				gameListUrl : process.env.GOG_DISCOUNTED_GAMES_URL,
				gameListUrlQueryOffset : 1,
				totalPagesField : 'totalPages',
				gameUrlField : 'url',
				gameArrayField : 'products',
				gameTitleField : 'title',
				fieldsToOriginalPrice : ['price','baseAmount'],
				fieldsToSpecialPrice : ['price','finalAmount'],
				maxRequests : 1000,
			});
			console.log(response);
			if (refreshState==='stopped') return;
		}

		if (refreshIGDBData) {
			response = await appendIGDBGameData();
			console.log(response);
			if (refreshState==='stopped') return;
		}

		refreshState = 'stopped';
		currentRefreshType=null;
		currentlyBeingRefreshed=null;
		console.log("Frissítés vége");
	} catch(err){
		console.log(err);
	}
}

router.get('/getRefreshDetails',[m.isAuthenticated,m.isAdmin],(req,res)=>{
	res.status(200).json({
		currentRefreshType: currentRefreshType,
		currentlyBeingRefreshed: currentlyBeingRefreshed,
		refreshState: refreshState,
		refreshInterval: refreshInterval,
		refreshIGDBData: refreshIGDBData,
		storesToRefresh: storesToRefresh
	});
})

router.post('/refreshGamesAutomatically',[m.isAuthenticated,m.isAdmin],(req,res)=>{
	if (currentRefreshType !== 'automatic') currentRefreshType='automatic';

	storesToRefresh = req.body.selectedStores;
	refreshIGDBData = req.body.refreshIGDBData;

	refreshInterval = (1000*60*req.body.refreshIntervalMinutes)+
	(1000*60*60*req.body.refreshIntervalHours)+
	(1000*60*60*24*req.body.refreshIntervalDays);

	refreshGames();
	automaticRefreshInterval = setInterval(refreshGames,refreshInterval);

	res.status(200).json({
		message: 'Játékok automatikus frissítése folyamatban',
		currentRefreshType: currentRefreshType,
		currentlyBeingRefreshed: currentlyBeingRefreshed,
		refreshState: refreshState,
		refreshInterval: refreshInterval,
		refreshIGDBData: refreshIGDBData
	});
})

router.post('/refreshGamesOnce',[m.isAuthenticated,m.isAdmin],(req,res)=>{
	if (currentRefreshType !== 'manual') currentRefreshType='manual';
	
	storesToRefresh = req.body.selectedStores;
	refreshIGDBData = req.body.refreshIGDBData;

	refreshGames();
	res.status(200).json({
		message: 'Játékok egyszeri frissítése folyamatban',
		currentRefreshType: currentRefreshType,
		currentlyBeingRefreshed: currentlyBeingRefreshed,
		refreshState: refreshState,
		refreshIGDBData: refreshIGDBData
	});
})

router.get('/stopRefresh',[m.isAuthenticated,m.isAdmin],(req,res)=>{
	if (refreshState==='running') {
		if (currentRefreshType === 'automatic') {
			clearInterval(automaticRefreshInterval);
			refreshInterval=null;
		}

		refreshState = 'stopped';
		currentlyBeingRefreshed = null;

		console.log('Admin parancsra a(z) '+ currentRefreshType+" frissítés leállítása");
		res.status(200).json({
			message: `Játékok ${currentRefreshType} frissítése leállítva`,
			currentRefreshType: null,
			currentlyBeingRefreshed: currentlyBeingRefreshed,
			refreshState: refreshState,
			refreshInterval: refreshInterval
		});
		currentRefreshType=null;
	} else {
		res.status(400).json({message: 'Jelenleg nem fut a frissítés'});
	}
})

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