import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../game/game';
import { GameService } from '../game/game.service';
import { UserService } from '../shared/user/user.service';
import { FilterService } from '../shared/filter/filter.service';
import { CurrencyService } from '../shared/currency/currency.service';
import { StoreService } from '../shared/store/store.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})

export class DealsComponent implements OnInit {
	selectedGame: Game;
	numberOfWatchedGames=0;
	uniqueWatchedGenres=[];
	genreStatistics=[];
	showViewedGenres=false;

	constructor(
		private router: Router,
		private loadingScreenService: LoadingScreenService,
		private gameService: GameService,
		private userService: UserService,
		private storeService: StoreService,
		private filterService: FilterService,
		private currencyService: CurrencyService,
		private translateService: TranslateService
	) {}

	ngOnInit() {
		/*if (!this.userService.isAuthenticated()){
			this.router.navigate(['/login']);
		}*/

		this.loadingScreenService.setAnimation(true);
		this.gameService.resetGamesData();
		this.gameService.resetUnwindedGamesList();
		this.filterService.resetFilter();
		this.getGameList(this.filterService.filter,true);

		if (this.userService.isAuthenticated()){
			this.getRecommendedGamesByHistory();
			this.getGameHistory();
		}
	}

	getGameList(filter,startLoadingAnimation){
		if (startLoadingAnimation) this.loadingScreenService.setAnimation(true);
		this.gameService.getGameList(filter).subscribe(
			(res: any)=>{
				/*if (this.userService.isAuthenticated()){
					this.userService.resetSession(res.accessToken);	
					this.userService.getMessages();
				}*/
				this.gameService.setTotalGamesCount(res.totalGamesCount);
				this.gameService.setFilteredGamesCount(res.filteredGamesCount);
				/*for (let i=0;i<res.discountedGames.length;i++){
					this.gameService.pushGamesData(res.discountedGames[i]);
				}*/
				for (let i=0;i<res.unwindedDiscountedGames.length;i++){
					this.gameService.pushUnwindedGamesList(res.unwindedDiscountedGames[i]);
				}
				if (startLoadingAnimation) this.loadingScreenService.setAnimation(false);
			},
			(err)=>{
				if (startLoadingAnimation) this.loadingScreenService.setAnimation(false);
				console.log(err);
			},
			()=>{
				if (startLoadingAnimation) this.loadingScreenService.setAnimation(false);
			});
	}

	getRecommendedGamesByHistory(){
		this.userService.getGameHistory().subscribe(
			(res: any)=>{
				this.gameService.getRecommendedGamesByHistory(res.gameHistory).subscribe(
					(res: any)=>{
						this.genreStatistics = res.genreStatistics;
						this.uniqueWatchedGenres = res.uniqueWatchedGenres;
						this.gameService.resetRecommendedGames();
						for(let i=0;i<res.recommendedGames.length;i++){
							this.gameService.pushRecommendedGames(res.recommendedGames[i]);
						}
					},
					(err)=>{
						console.log(err);
					})
			},
			(err)=>{
				console.log(err);
			})
	}

	getGameHistory(){
		this.userService.getGameHistory().subscribe(
			(res: any)=>{
				this.gameService.getGameHistory(res.gameHistory).subscribe(
					(res: any)=>{
						this.gameService.resetGamesData();
						for (let i=0;i<res.watchedGames.length;i++){
							this.gameService.pushGamesData(res.watchedGames[i]);
						}
						this.numberOfWatchedGames=res.watchedGames.length;
					},
					(err)=>{
						console.log(err);
					});
			},
			(err)=>{
				console.log(err);
			})
	}

	deleteGameHistory(){
		if (confirm(this.translateService.instant('confirmDelete'))) {
			this.loadingScreenService.setAnimation(true);
			this.userService.deleteGameHistory().subscribe(
				(res: any)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
					this.numberOfWatchedGames = 0;
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(err.error.message);
				})
		}
	}

	getCurrencies(){
		return this.currencyService.getCurrencies();
	}

	getRecommendedGames(){
		return this.gameService.getRecommendedGames();
	}

	getCheapestStore(game){
		return game.stores.reduce((accumulator, currentValue)=>{
			return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
		})
	}

	checkSorting(sortBy: String){
		if (this.filterService.filter.sortBy===sortBy){
			if (this.filterService.filter.direction===1){
				return '\u2191';
			} else {
				return '\u2193';
			}
		}
	}

	sortTable(sortBy?: String){
		//this.loadingScreenService.setAnimation(true);

		if (sortBy){
			this.filterService.sortTable(sortBy);
		}

		this.gameService.resetGamesData();
		this.gameService.resetUnwindedGamesList();
		this.filterService.applyFilter();
		this.getGameList(this.filterService.filter,true);
	}

	numberOfGamesLeft(){
		return this.gameService.getFilteredGamesCount()-
		(this.filterService.filter.gameRequestOffset+this.filterService.filter.gamesPerRequest);
	}

	showMore(){
		this.filterService.increaseOffset();
		this.getGameList(this.filterService.filter,false);
	}

	currencyConverter(amount: number,from: String,to: String){
		return this.currencyService.currencyConverter(amount,from,to);
	}

	getCurrencyService(){
		return this.getCurrencyService;
	}

	getLoadingScreenService(){
		return this.loadingScreenService;
	}

	getGameService(){
		return this.getGameService;
	}

	getGamesData(){
		return this.gameService.getGamesData();
	}

	getUnwindedGamesList(){
		return this.gameService.getUnwindedGamesList();
	}

	getUserService(){
		return this.userService;
	}

	getGamesPerRequest(){
		if (this.numberOfGamesLeft()>=this.getFilterService().filter.gamesPerRequest){
			return this.getFilterService().filter.gamesPerRequest;
		} else {
			return this.numberOfGamesLeft();
		}
	}
	/*
	getCheapestStore(game){
		return game.stores.reduce((accumulator, currentValue)=>{
			return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
		})
	}*/

	getCheapestStoreByGameId(gameId){
		this.gameService.getGame(gameId).subscribe(
			(res:any)=>{
				return res.game.stores.reduce((accumulator, currentValue)=>{
					return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
				})
			},
			(err)=>{
				console.log(err);
			})
	}

	getUniqueGames(gamesList){
		return gamesList.filter((currentElement,currentIndex,compareArray)=>
			compareArray.findIndex(element=>(element._id === currentElement._id))===currentIndex);
	}

	goToExternalUrl(url){
		window.location.href = url;
	}

	showAllStores(game){
		this.selectedGame = game;
	}

	getFilterService(){
		return this.filterService;
	}

	getTotalGamesCount(){
		return this.gameService.getTotalGamesCount();
	}

	getFilteredGamesCount(){
		return this.gameService.getFilteredGamesCount();
	}

	isFilterOpened(){
		return this.filterService.isFilterOpened();
	}

	areCurrenciesReceived(){
		return this.currencyService.areCurrenciesReceived();
	}

	areStoresReceived(){
		return this.storeService.areStoresReceived();
	}

	onClose(){
		this.selectedGame=null;
	}
}
