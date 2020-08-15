if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');
const router = express.Router();
const request = require('request');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const Game = require('../models/game');
const m = require('../config/middlewares');
var appList=[];
var requestStartIndex=32800;
var requestEndIndex=33000;
var stepToNextStore = false;

start();

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

		const recommendedGames = await Game.find({genres: {$in: uniqueWatchedGenres}}).sort({metascore: -1,discountPercent: -1}).limit(10);
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

router.post('/',[m.isAuthenticated,m.refreshToken()],async(req,res)=>{
	let filter={};
	let value;
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
			filter['stores.specialPrice']['$gte'] = req.query.minSpecialPrice;
		} else {
			filter['stores.specialPrice'] = {
				$gte : req.query.minSpecialPrice
			}
		}
	}

	if (req.query.maxSpecialPrice!=null && req.query.maxSpecialPrice!=''){
		if (filter['stores.specialPrice']){
			filter['stores.specialPrice']['$lte'] = req.query.maxSpecialPrice;
		} else {
			filter['stores.specialPrice'] = {
				$lte : req.query.maxSpecialPrice
			}
		}
	}

	if (req.query.minOriginalPrice!=null && req.query.minOriginalPrice!=''){
		if (filter['stores.originalPrice']){
			filter['stores.originalPrice']['$gte'] = req.query.minOriginalPrice;
		} else {
			filter['stores.originalPrice'] = {
				$gte : req.query.minOriginalPrice
			}
		}
	}

	if (req.query.maxOriginalPrice!=null && req.query.maxOriginalPrice!=''){
		if (filter['stores.originalPrice']){
			filter['stores.originalPrice']['$lte'] = req.query.maxOriginalPrice;
		} else {
			filter['stores.originalPrice'] = {
				$lte : req.query.maxOriginalPrice
			}
		}
	}

	if (req.query.minDiscountPercent!=null && req.query.minDiscountPercent!=''){
		if (filter['stores.discountPercent']){
			filter['stores.discountPercent']['$gte'] = req.query.minDiscountPercent;
		} else {
			filter['stores.discountPercent'] = {
				$gte : req.query.minDiscountPercent
			}
		}
	}

	if (req.query.maxDiscountPercent!=null && req.query.maxDiscountPercent!=''){
		if (filter['stores.discountPercent']){
			filter['stores.discountPercent']['$lte'] = req.query.maxDiscountPercent;
		} else {
			filter['stores.discountPercent'] = {
				$lte : req.query.maxDiscountPercent
			}
		}
	}

	if (req.query.minMetascore!=null && req.query.minMetascore!=''){
		if (filter.metascore){
			filter.metascore.$lte = req.query.minMetascore;
		} else {
			filter.metascore={
				$gte : req.query.minMetascore
			}
		}
	}

	if (req.query.maxMetascore!=null && req.query.maxMetascore!=''){
		if (filter.metascore){
			filter.metascore.$lte = req.query.maxMetascore;
		} else {
			filter.metascore={
				$lte : req.query.maxMetascore
			}
		}
	}

	try {
		var sortObject = {};
		if (req.query.sortBy==='specialPrice' || req.query.sortBy==='originalPrice' || 
		 req.query.sortBy==='discountPercent') {
			sortObject['stores.'+req.query.sortBy] = req.query.direction;
		} else {
			sortObject[req.query.sortBy] = req.query.direction;
		}

		const totalGamesCount = await Game.countDocuments();
		const filteredGamesCount = await Game.countDocuments(filter);
		const discountedGames = await Game.find(filter).sort(sortObject).limit(10).skip(parseInt(req.query.gameRequestOffset));
		res.status(200).json({
			accessToken: req.accessToken,
			totalGamesCount: totalGamesCount,
			filteredGamesCount: filteredGamesCount,
			discountedGames: discountedGames
		});
	} catch(err){
		res.status(500).json({message: err.message});
	}
});

function checkCurrency(currency,amount){
	return currency=='EUR'?amount*100:amount;
}

async function resetStillOnSaleFields(storeName){
	let games = await Game.find({'stores.name':storeName});
	games.forEach(game=>{
		for(let i=0;i<game.stores.length;i++){
			if (game.stores[i].name==storeName && !game.stores[i].expired){
				game.stores[i].stillOnSale = false;
				break;
			}
		}
		saveToDatabase(game);
	})
}

async function markExpiredDeals(storeName){
	let games = await Game.find({'stores.name':storeName});
	games.forEach(game=>{
		for(let i=0;i<game.stores.length;i++){
			if (game.stores[i].name==storeName && !game.stores[i].expired && !game.stores[i].stillOnSale){
				game.stores[i].expired = true;
				break;
			}
		}
		saveToDatabase(game);
	})
}

function saveScrapedGames(scrapedGames,storeName,resolve){
	let gameObjects = [];
	for(var j=0;j<scrapedGames.titles.length;j++){
		gameObjects.push({
			title : scrapedGames.titles[j],
			discountPrice : scrapedGames.discountPrices[j],
			originalPrice : scrapedGames.originalPrices[j],
			linkToGame : scrapedGames.linksToGame[j]
		})
	}

	gameObjects.forEach(async game=>{
		try {
			let gameFoundInDatabase = await Game.findOne({name: game.title});

			if (!gameFoundInDatabase) {
				var options = {
					method: 'GET',
					url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${game.title}`),
					qs: {platform: 'pc'},
					headers: {
						'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
						'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
						useQueryString: true
					}
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					const newGame = new Game({
						name : game.title
					})

					newGame.stores.push({
						name : storeName,
						originalPrice : game.originalPrice,
						specialPrice : game.discountPrice,
						discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
						linkToGame : game.linkToGame
					})

					if (JSON.parse(body).result && JSON.parse(body).result.score) {
						newGame.metascore = JSON.parse(body).result.score;
						newGame.genres = JSON.parse(body).result.genre;
						newGame.description = JSON.parse(body).result.description;

						if (IsValidDate(JSON.parse(body).result.releaseDate)) {
							newGame.releaseDate = JSON.parse(body).result.releaseDate;
						}
					}

					saveToDatabase(newGame);
				});
			} else {
				if (gameFoundInDatabase.stores.length>1){
					console.log(gameFoundInDatabase);
				}

				gameFoundInDatabase.stores.push({
					name : storeName,
					originalPrice : game.originalPrice,
					specialPrice : game.discountPrice,
					discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
					linkToGame : game.linkToGame
				})

				saveToDatabase(gameFoundInDatabase);
			}

			if (game==gameObjects[gameObjects.length-1]){
				console.log(game);
				return Promise.resolve(`${storeName} játékok frissítve`);
			}
		} catch(err){
			console.log(err);
		}
	})
}

function refreshBlizzardGames(){
	return new Promise((resolve,reject)=>{
		(async()=>{

			var storeName = "Blizzard";
			// hamisra állítjuk az adatbázisban azokat a mezőket,
			// amik azt jelzik, hogy az adott áruházban az adott játék akciós-e még,
			// és lentebb elvégezzük azt az ellenőrzést ami igazat ad, ha a játék még mindig akciós
			// az áruház honlapján és az adatbázisba már korábban bekerült
			resetStillOnSaleFields(storeName);

			let browser = await puppeteer.launch({
			  'args' : [
			    '--no-sandbox',
			    '--disable-setuid-sandbox'
			  ]
			});

			let page = await browser.newPage();

			await page.goto(process.env.BLIZZARD_GAMES_URL,{waitUntil: 'networkidle2'});

			let scrapedPage = await page.evaluate(()=>{
				let gameUrlList = Array.from(document.querySelectorAll('.menu-item.games.ng-star-inserted storefront-navigation-links:not(.condensed-services-links) a'),element => element.href);

				return {
					gameUrlList
				}
			})

			for(i=0;i<scrapedPage.gameUrlList.length;i++){
				await page.goto(scrapedPage.gameUrlList[i],{waitUntil: 'networkidle2'});

				let scrapedGames = await page.evaluate(()=>{
					let gameDivs = Array.from(document.querySelectorAll('storefront-browsing-card'),element=>element.innerHTML);
					let titles = [];
					let originalPrices = [];
					let discountPrices = [];
					let linksToGame = [];

					for(j=0;j<gameDivs.length;j++){
						let gameDiv = document.createElement("div");
						gameDiv.innerHTML = gameDivs[j];
						let title = gameDiv.querySelector('.name');
						let originalPrice = gameDiv.querySelector('.name~.price .full');
						let discountPrice = gameDiv.querySelector('.name~.price .discount');
						let linkToGame = gameDiv.querySelector('a');

						if (discountPrice) {
							titles.push(title.innerText.replace('®',''));
							discountPrices.push(discountPrice.innerText);
							originalPrices.push(originalPrice.innerText);
							linksToGame.push(linkToGame.href);
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
				})

				if (!scrapedGames) {
					if (i==scrapedPage.gameUrlList.length-1) {
						resolve('Blizzard játékok frissítve');
					}
					continue;
				} else {
					let gameObjects = [];

					for(var j=0;j<scrapedGames.titles.length;j++){
						gameObjects.push({
							title : scrapedGames.titles[j],
							discountPrice : scrapedGames.discountPrices[j],
							originalPrice : scrapedGames.originalPrices[j],
							linkToGame : scrapedGames.linksToGame[j]
						})
					}

					gameObjects.forEach(async game=>{
						try {
							let gameFoundInDatabase = await Game.findOne({name: game.title});

							if (!gameFoundInDatabase) {
								var options = {
									method: 'GET',
									url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${game.title}`),
									qs: {platform: 'pc'},
									headers: {
										'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
										'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
										useQueryString: true
									}
								};

								request(options, function (error, response, body) {
									if (error) throw new Error(error);

									const newGame = new Game({
										name : game.title
									})

									newGame.stores.push({
										name : storeName,
										originalPrice : game.originalPrice,
										specialPrice : game.discountPrice,
										discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
										linkToGame : game.linkToGame,
										expired : false,
										stillOnSale : true
									})

									if (JSON.parse(body).result && JSON.parse(body).result.score) {
										newGame.metascore = JSON.parse(body).result.score;
										newGame.genres = JSON.parse(body).result.genre;
										newGame.description = JSON.parse(body).result.description;

										if (IsValidDate(JSON.parse(body).result.releaseDate)) {
											newGame.releaseDate = JSON.parse(body).result.releaseDate;
										}
									}

									saveToDatabase(newGame);
								});
							} else {

								if (gameFoundInDatabase.stores.length>1){
									console.log(gameFoundInDatabase);
								}

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

									//ha a játék szerepel az adatbázisban és még akciós
									if (gameStillOnSale){
										gameStillOnSale.stores.forEach(store=>{
											if (store.name==storeName){
												store.stillOnSale = true;
											}
										});

										saveToDatabase(gameStillOnSale);
									} else {
										//ha a játék már szerepel az adatbázisban és az előző akciós ár lejárt
										//vagy eltérő a jelenlegi akciós ártól, akkor a korábbi adatokat
										//felül írjuk
										gameFoundInDatabase.stores.forEach(store=>{
											if (store.name==storeName){
												store.originalPrice = game.originalPrice;
												store.specialPrice = game.discountPrice;
												store.discountPercent = Math.round((1-(game.discountPrice/game.originalPrice))*100);
												store.linkToGame = game.linkToGame;
												store.expired = false;
												store.stillOnSale = true;
											}
										})

										saveToDatabase(gameFoundInDatabase);
									}
								} else {
									gameFoundInDatabase.stores.push({
										name : storeName,
										originalPrice : game.originalPrice,
										specialPrice : game.discountPrice,
										discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
										linkToGame : game.linkToGame,
										expired : false,
										stillOnSale : true
									})

									saveToDatabase(gameFoundInDatabase);
								}
							}

							if ((i==scrapedPage.gameUrlList.length-1) && (game==gameObjects[gameObjects.length-1])){
								markExpiredDeals(storeName);
								resolve(`Blizzard játékok frissítve`);
							}
						} catch(err){
							console.log(err);
						}
					})
				}
			}

			debugger;

			await browser.close();
		})();
	});
}

function refreshEpicGames(){
	return new Promise((resolve,reject)=>{
		(async()=>{
			var storeName = 'Epic Games Store';
			resetStillOnSaleFields(storeName);

			let browser = await puppeteer.launch({
			  'args' : [
			    '--no-sandbox',
			    '--disable-setuid-sandbox'
			  ]
			});
			let page = await browser.newPage();
			await page.setDefaultNavigationTimeout(0);
			await page.goto(process.env.EPIC_GAMES_ALL_GAMES_URL,{waitUntil: 'networkidle0'});

			let scrapedGames = await page.evaluate(async()=>{
				//várunk 10 mp-et hogy betöltődjön az oldalon minden script
				await new Promise(function(resolve) { 
			           setTimeout(resolve, 10000)
			    });

				let gameCards = Array.from(document.querySelectorAll(`[data-component="CatalogItemOfferCard"]`),element=>element.innerHTML);
				let titles = [];
				let originalPrices = [];
				let discountPrices = [];
				let linksToGame = [];

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

				//€ jel levágása
				for(i=0;i<discountPrices.length;i++){
					originalPrices[i] = originalPrices[i].substring(1,originalPrices[i].length);
					discountPrices[i] = discountPrices[i].substring(1,discountPrices[i].length);
				}

				if (!discountPrices.length) return null;
				else return {
					titles,
					discountPrices,
					originalPrices,
					linksToGame
				}
			})

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

				gameObjects.forEach(async game=>{
					try {
						let gameFoundInDatabase = await Game.findOne({name: game.title});

						if (!gameFoundInDatabase) {
							var options = {
								method: 'GET',
								url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${game.title}`),
								qs: {platform: 'pc'},
								headers: {
									'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
									'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
									useQueryString: true
								}
							};

							request(options, function (error, response, body) {
								if (error) throw new Error(error);

								const newGame = new Game({
									name : game.title
								})

								newGame.stores.push({
									name : storeName,
									originalPrice : game.originalPrice,
									specialPrice : game.discountPrice,
									discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
									linkToGame : game.linkToGame,
									expired : false,
									stillOnSale : true
								})

								if (JSON.parse(body).result && JSON.parse(body).result.score) {
									newGame.metascore = JSON.parse(body).result.score;
									newGame.genres = JSON.parse(body).result.genre;
									newGame.description = JSON.parse(body).result.description;

									if (IsValidDate(JSON.parse(body).result.releaseDate)) {
										newGame.releaseDate = JSON.parse(body).result.releaseDate;
									}
								}

								saveToDatabase(newGame);
							});
						} else {

							if (gameFoundInDatabase.stores.length>1){
								console.log(gameFoundInDatabase);
							}

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

								//ha a játék szerepel az adatbázisban és még akciós
								if (gameStillOnSale){
									gameStillOnSale.stores.forEach(store=>{
										if (store.name==storeName){
											store.stillOnSale = true;
										}
									});

									saveToDatabase(gameStillOnSale);
								} else {
									//ha a játék már szerepel az adatbázisban és az előző akciós ár lejárt
									//vagy eltérő a jelenlegi akciós ártól, akkor a korábbi adatokat
									//felül írjuk
									gameFoundInDatabase.stores.forEach(store=>{
										if (store.name==storeName){
											store.originalPrice = game.originalPrice;
											store.specialPrice = game.discountPrice;
											store.discountPercent = Math.round((1-(game.discountPrice/game.originalPrice))*100);
											store.linkToGame = game.linkToGame;
											store.expired = false;
											store.stillOnSale = true;
										}
									})

									saveToDatabase(gameFoundInDatabase);
								}
							} else {
								gameFoundInDatabase.stores.push({
									name : storeName,
									originalPrice : game.originalPrice,
									specialPrice : game.discountPrice,
									discountPercent : Math.round((1-(game.discountPrice/game.originalPrice))*100),
									linkToGame : game.linkToGame,
									expired : false,
									stillOnSale : true
								})

								saveToDatabase(gameFoundInDatabase);
							}
						}

						if (game==gameObjects[gameObjects.length-1]){
							markExpiredDeals(storeName);
							resolve(`${storeName} játékok frissítve`);
						}
					} catch(err){
						console.log(err);
					}
				})
			}

			debugger;

			await browser.close();
		})();
	})
}

function refreshHumbleBundleGames(){
	return new Promise((resolve,reject)=>{
		let totalPages;
		var storeName="Humble Bundle";
		resetStillOnSaleFields(storeName);

		request(process.env.HUMBLE_BUNDLE_DISCOUNTED_GAMES_URL,function(error,response,body){
			if (error) {
				console.log(error);
				process.exit(1);
			}

			totalPages = JSON.parse(response.body).num_pages;
			for(page=0;page<totalPages;page++){
				request(process.env.HUMBLE_BUNDLE_DISCOUNTED_GAMES_URL+`&page=${page}`,function(error,response,body){
					if (error) {
						console.log(error);
						process.exit(1);
					}
					humbleBundleGamesList = JSON.parse(response.body).results;
					humbleBundleGamesList.forEach(async game=>{
						try {
							let gameFoundInDatabase = await Game.findOne({name: game.human_name});

							if (!gameFoundInDatabase) {
								var options = {
									method: 'GET',
									url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${game.human_name}`),
									qs: {platform: 'pc'},
									headers: {
										'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
										'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
										useQueryString: true
									}
								};

								request(options, function (error, response, body) {
									if (error) throw new Error(error);

									const humbleBundleGame = new Game({
										name : game.human_name
									})

									humbleBundleGame.stores.push({
										name : storeName,
										originalPrice : game.full_price.amount,
										specialPrice : game.current_price.amount,
										discountPercent : Math.round((1-(game.current_price.amount/game.full_price.amount))*100),
										linkToGame : process.env.HUMBLE_BUNDLE_URL+game.human_url,
										expired : false,
										stillOnSale : true
									})

									if (game.standard_carousel_image) {
										humbleBundleGame.stores[humbleBundleGame.stores.length-1].image = game.standard_carousel_image;
									}

									if (JSON.parse(body).result && JSON.parse(body).result.score) {
										humbleBundleGame.metascore = JSON.parse(body).result.score;
										humbleBundleGame.genres = JSON.parse(body).result.genre;
										humbleBundleGame.description = JSON.parse(body).result.description;

										if (IsValidDate(JSON.parse(body).result.releaseDate)) {
											humbleBundleGame.releaseDate = JSON.parse(body).result.releaseDate;
										}
									}

									saveToDatabase(humbleBundleGame);

									if (game==humbleBundleGamesList[humbleBundleGamesList.length-1]){
										resolve(`${storeName} játékok frissítve`);
									}
								});
							} else {

								if (gameFoundInDatabase.stores.length>1){
									console.log(gameFoundInDatabase);
								}

								if (gameFoundInDatabase.stores.filter(function(store){
								return store.name==storeName; }).length > 0) {
									let gameStillOnSale = await Game.findOne({
										name: game.human_name,
										$and:[
											{'stores.name':storeName},
											{'stores.specialPrice':game.current_price.amount},
											{'stores.expired':false}
										]
									});

									//ha a játék szerepel az adatbázisban és még akciós
									if (gameStillOnSale){
										gameStillOnSale.stores.forEach(store=>{
											if (store.name==storeName){
												store.stillOnSale = true;
											}
										});

										saveToDatabase(gameStillOnSale);
									} else {
										//ha a játék már szerepel az adatbázisban és az előző akciós ár lejárt
										//vagy eltérő a jelenlegi akciós ártól, akkor a korábbi adatokat
										//felül írjuk
										gameFoundInDatabase.stores.forEach(store=>{
											if (store.name==storeName){
												store.name = storeName;
												store.originalPrice = game.full_price.amount;
												store.specialPrice = game.current_price.amount;
												store.discountPercent = Math.round((1-(game.current_price.amount/game.full_price.amount))*100);
												store.linkToGame = process.env.HUMBLE_BUNDLE_URL+game.human_url;
												store.expired = false;
												store.stillOnSale = true;
											}
										})

										saveToDatabase(gameFoundInDatabase);
									}
								} else {
									gameFoundInDatabase.stores.push({
										name : storeName,
										originalPrice : game.full_price.amount,
										specialPrice : game.current_price.amount,
										discountPercent : Math.round((1-(game.current_price.amount/game.full_price.amount))*100),
										linkToGame : process.env.HUMBLE_BUNDLE_URL+game.human_url,
										expired : false,
										stillOnSale : true
									})

									saveToDatabase(gameFoundInDatabase);
								}

								if (game==humbleBundleGamesList[humbleBundleGamesList.length-1]){
									markExpiredDeals(storeName);
									resolve(`${storeName} játékok frissítve`);
								}
							}
						}  catch(err){
							console.log(err);
						}
					})
				})
			}
		})
	})
}

function refreshGoGGames(){
	return new Promise((resolve,reject)=>{
		let totalPages;
		var storeName = "GoG";
		resetStillOnSaleFields(storeName);

		request(process.env.GOG_DISCOUNTED_GAMES_URL,function(error,response,body){
			if (error) {
				console.log(error);
				process.exit(1);
			}

			totalPages = JSON.parse(response.body).totalPages;
			for(page=0;page<totalPages;page++){
				request(process.env.GOG_DISCOUNTED_GAMES_URL+`&page=${page+1}`,function(error,response,body){
					if (error) {
						console.log(error);
						process.exit(1);
					}

					gogDiscountedGamesList = JSON.parse(response.body).products;
					gogDiscountedGamesList.forEach(async game=>{
						try {
							let gameFoundInDatabase = await Game.findOne({name: game.title});

							if (!gameFoundInDatabase) {
								var options = {
									method: 'GET',
									url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${game.title}`),
									qs: {platform: 'pc'},
									headers: {
										'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
										'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
										useQueryString: true
									}
								};

								request(options, function (error, response, body) {
									if (error) throw new Error(error);

									const gogGame = new Game({
										name : game.title,
										genres : game.genres
									})

									gogGame.stores.push({
										name : 'GoG',
										originalPrice : game.price.baseAmount,
										specialPrice : game.price.finalAmount,
										discountPercent : game.price.discount,
										linkToGame : process.env.GOG_URL+game.url,
										image : game.image+'.jpg',
										expired : false,
										stillOnSale : true
									})

									if (IsJsonString(body) && JSON.parse(body).result && JSON.parse(body).result.score) {
										gogGame.metascore = JSON.parse(body).result.score;
										gogGame.description = JSON.parse(body).result.description;

										if (IsValidDate(JSON.parse(body).result.releaseDate)) {
											gogGame.releaseDate = JSON.parse(body).result.releaseDate;
										}
									}

									saveToDatabase(gogGame);

									if (game==gogDiscountedGamesList[gogDiscountedGamesList.length-1]){
										resolve(`${storeName} játékok frissítve`);
									}
								});
							} else {

								if (gameFoundInDatabase.stores.length>1){
									console.log(gameFoundInDatabase);
								}

								if (gameFoundInDatabase.stores.filter(function(store){
								return store.name==storeName; }).length > 0) {
									let gameStillOnSale = await Game.findOne({
										name: game.title,
										$and:[
											{'stores.name':storeName},
											{'stores.specialPrice':game.price.finalAmount},
											{'stores.expired':false}
										]
									});

									//ha a játék szerepel az adatbázisban és még akciós
									if (gameStillOnSale){
										gameStillOnSale.stores.forEach(store=>{
											if (store.name==storeName){
												store.stillOnSale = true;
											}
										});

										saveToDatabase(gameStillOnSale);
									} else {
										//ha a játék már szerepel az adatbázisban és az előző akciós ár lejárt
										//vagy eltérő a jelenlegi akciós ártól, akkor a korábbi adatokat
										//felül írjuk
										gameFoundInDatabase.stores.forEach(store=>{
											if (store.name==storeName){
												store.name = storeName;
												store.originalPrice = game.price.baseAmount;
												store.specialPrice = game.price.finalAmount;
												store.discountPercent = game.price.discount;
												store.linkToGame = process.env.GOG_URL+game.url;
												store.image = game.image+'.jpg';
												store.expired = false;
												store.stillOnSale = true;
											}
										})

										saveToDatabase(gameFoundInDatabase);
									}
								} else {
									gameFoundInDatabase.stores.push({
										name : storeName,
										originalPrice : game.price.baseAmount,
										specialPrice : game.price.finalAmount,
										discountPercent : game.price.discount,
										linkToGame : process.env.GOG_URL+game.url,
										image : game.image+'.jpg',
										expired : false,
										stillOnSale : true
									})

									saveToDatabase(gameFoundInDatabase);
								}

								if (game==gogDiscountedGamesList[gogDiscountedGamesList.length-1]){
									markExpiredDeals(storeName);
									resolve(`${storeName} játékok frissítve`);
								}
							}
						} catch(err){
							console.log(err);
						}
					})
				});
			}
		});
	})
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

function start(){
	refreshGames();
	setInterval(refreshGames,300000);
}

async function refreshGames() {
	let blizzardResponse = await refreshBlizzardGames();
	console.log(blizzardResponse);
	let epicGamesResponse = await refreshEpicGames();
	console.log(epicGamesResponse);
	let humbleBundleResponse = await refreshHumbleBundleGames();
	console.log(humbleBundleResponse);
	let GoGGamesResponse = await refreshGoGGames();
	console.log(GoGGamesResponse);
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
		Object.keys(resp).forEach(id=>{
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

					var options = {
						method: 'GET',
						url: encodeURI(`https://chicken-coop.p.rapidapi.com/games/${discountedGame.name}`),
						qs: {platform: 'pc'},
						headers: {
							'x-rapidapi-host': 'chicken-coop.p.rapidapi.com',
							'x-rapidapi-key': '1a2ef2a335mshe95c8b4a26b1b45p1b0048jsnf46bb54a0c17',
							useQueryString: true
						}
					};

					request(options, function (error, response, body) {
						if (error) throw new Error(error);

						discountedGame.stores.push({
							name : 'Steam',
							originalPrice : appData.data.price_overview.initial/100,
							specialPrice : appData.data.price_overview.final/100,
							discountPercent : appData.data.price_overview.discount_percent,
							linkToGame : process.env.STEAM_APP_LINK_URL+parseInt(id),
							image : process.env.STEAM_APP_IMAGE_URL+parseInt(id)+'/header.jpg',
							steamID : id
						})

						if (JSON.parse(body).result && JSON.parse(body).result.score) {
							discountedGame.metascore = JSON.parse(body).result.score;
							discountedGame.genres = JSON.parse(body).result.genres;
							discountedGame.description = JSON.parse(body).result.description;

							if (IsValidDate(JSON.parse(body).result.releaseDate)) {
								discountedGame.releaseDate = JSON.parse(body).result.releaseDate;
							}
						}

						saveToDatabase(discountedGame);
					});
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

async function saveToDatabase(game){
	try {
		await game.save();
	} catch(err){
		console.log(err);
	}
}

module.exports = router;