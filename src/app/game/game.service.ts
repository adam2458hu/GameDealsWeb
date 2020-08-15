import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Game } from './game';
import { FilterService } from '../shared/filter/filter.service';
import { CurrencyService } from '../shared/currency/currency.service';
import { UserService } from '../shared/user/user.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
	private totalGamesCount: number;
	private filteredGamesCount: number;
	private gamesData: Game[]=[];
	private recommendedGames: Game[]=[];

	constructor(
		private http: HttpClient,
		private userService: UserService,
		private filterService: FilterService,
		private currencyService: CurrencyService
	) { }

	getGameList(filter){
		let queries=[];
		const prices = ["minSpecialPrice","maxSpecialPrice","minOriginalPrice","maxOriginalPrice"];
		Object.keys(filter).forEach(key=>{
			if (filter[key]!=null){
				if (prices.includes(key) && filter.currency!='EUR'){
					queries.push(key+'='+this.currencyService.currencyConverter(filter[key],filter.currency,'EUR'));
				} else {
					queries.push(key+'='+filter[key]);
				}
			}
		})//
		const queryString = '?'+queries.join('&');
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiGamesURL+queryString,{refreshToken: this.userService.getRefreshToken()},{headers:headers});
	}

	getRecommendedGamesByHistory(gameHistory){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiGamesURL+'/getRecommendedGames',{gameHistory: gameHistory},{headers: headers});
	}

	getGameHistory(gameHistory){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiGamesURL+'/getWatchedGames',{gameHistory: gameHistory},{headers:headers});
	}

	getRecommendedGames(){
		return this.recommendedGames;
	}

	getGamesData(){
		return this.gamesData;
	}

	getTotalGamesCount(){
		return this.totalGamesCount;
	}

	getFilteredGamesCount(){
		return this.filteredGamesCount;
	}

	resetGamesData(){
		this.gamesData = [];
	}

	resetRecommendedGames(){
		this.recommendedGames = [];
	}

	pushGamesData(data){
		this.gamesData.push(data);
	}

	pushRecommendedGames(game){
		this.recommendedGames.push(game);
	}

	setTotalGamesCount(count){
		this.totalGamesCount = count;
	}

	setFilteredGamesCount(count){
		this.filteredGamesCount = count;
	}
}
