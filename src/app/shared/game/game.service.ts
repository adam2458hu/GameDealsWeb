import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Game } from './game';
import { FilterService } from '../filter/filter.service';
import { CurrencyService } from '../currency/currency.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
	private totalGamesCount: number;
	private filteredGamesCount: number;
	private gamesData: Game[]=[];
	private unwindedGamesList: Game[]=[];
	private recommendedGames: Game[]=[];

	constructor(
		private http: HttpClient,
		private userService: UserService,
		private filterService: FilterService,
		private currencyService: CurrencyService
	) { }

	getIGDBAccessToken(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.get(environment.apiGamesURL+'/getIGDBAccessToken',{headers:headers});
	}

	requestIGDBAccessToken(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.get(environment.apiGamesURL+'/requestIGDBAccessToken',{headers:headers});
	}

	getRefreshDetails(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.get(environment.apiGamesURL+'/getRefreshDetails',{headers:headers});
	}

	refreshGamesOnce(refreshDetails: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiGamesURL+'/refreshGamesOnce',refreshDetails,{headers:headers});
	}

	refreshGamesAutomatically(refreshDetails: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiGamesURL+'/refreshGamesAutomatically',refreshDetails,{headers:headers});
	}

	stopRefresh(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.get(environment.apiGamesURL+'/stopRefresh',{headers:headers});
	}

	getGame(_id){
		return this.http.get(environment.apiGamesURL+'/getGame/'+_id);
	}

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

		if (this.userService.isAuthenticated()){
			var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
			return this.http.get(environment.apiGamesURL+queryString,{headers:headers});
		} else {
			return this.http.get(environment.apiGamesURL+queryString);
		}
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

	getUnwindedGamesList(){
		return this.unwindedGamesList;
	}

	getTotalGamesCount(){
		return this.totalGamesCount;
	}

	getFilteredGamesCount(){
		return this.filteredGamesCount;
	}

	resetUnwindedGamesList(){
		this.unwindedGamesList = [];
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

	pushUnwindedGamesList(data){
		this.unwindedGamesList.push(data);
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
