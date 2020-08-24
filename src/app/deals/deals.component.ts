import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

	constructor(
		private router: Router,
		private loadingScreenService: LoadingScreenService,
		private gameService: GameService,
		private userService: UserService,
		private storeService: StoreService,
		private filterService: FilterService,
		private currencyService: CurrencyService
	) {}

	ngOnInit() {
		/*if (!this.userService.isAuthenticated()){
			this.router.navigate(['/login']);
		}*/

		this.loadingScreenService.setAnimation(true);
		this.gameService.resetGamesData();
		this.filterService.resetFilter();
		this.getGameList(this.filterService.filter,true);
	}

	getGameList(filter,startLoadingAnimation){
		if (startLoadingAnimation) this.loadingScreenService.setAnimation(true);
		this.gameService.getGameList(filter).subscribe(
			(res: any)=>{
				if (this.userService.isAuthenticated()){
					this.userService.resetSession(res.accessToken);	
					this.userService.getMessages();
				}

				this.gameService.setTotalGamesCount(res.totalGamesCount);
				this.gameService.setFilteredGamesCount(res.filteredGamesCount);
				for (let i=0;i<res.discountedGames.length;i++){
					this.gameService.pushGamesData(res.discountedGames[i]);
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

	getGamesPerRequest(){
		if (this.numberOfGamesLeft()>=this.getFilterService().filter.gamesPerRequest){
			return this.getFilterService().filter.gamesPerRequest;
		} else {
			return this.numberOfGamesLeft();
		}
	}

	getCheapestStore(game){
		return game.stores.reduce((accumulator, currentValue)=>{
			return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
		})
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
