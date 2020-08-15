import { Component, OnInit} from '@angular/core';
import { Game } from '../game/game';
import { UserService } from '../shared/user/user.service';
import { GameService } from '../game/game.service';
import { FilterService } from '../shared/filter/filter.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	index=0;
	numberOfWatchedGames=0;
	showViewedGenres=false;
	images: String[]=['pubg','aco','ets2'];
	titles: String[]=['PLAYERUNKNOWNS BATTLEGROUNDS leárazás','Assassins Creed: Odyssey leárazás','Euro Truck Simulator 2 akció'];
	discounts: String[]=['-50%','-67%','-75%'];
	endOfOffer: Date[]=[new Date(2020, 7, 29, 0, 0, 0, 0),new Date(2020, 7, 27, 0, 0, 0, 0),new Date(2020, 7, 27, 0, 0, 0, 0)];
	links: String[]=['https://store.steampowered.com/app/578080/PLAYERUNKNOWNS_BATTLEGROUNDS/',
	'https://store.steampowered.com/app/812140/Assassins_Creed_Odyssey/','https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'];
	t;
	genreStatistics=[];
	uniqueWatchedGenres=[];
	r;
	fadeIn: Boolean;
	months: String[]=['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
	selectedGame: Game;

	constructor(
		private userService: UserService,
		private gameService: GameService,
		private filterService: FilterService,
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		this.fadeIn = true;
		this.resetAnimation();
		this.startAnimation();
		this.gameService.resetGamesData();
		this.filterService.resetFilter();
		this.getRecommendedGamesByHistory();
		this.getGameHistory();
	}

	resetAnimation(){
		this.r = setTimeout(()=>{
			this.fadeIn = false;
		},300);
	}

	startAnimation(){
		this.t = setInterval(()=>{
			this.fadeIn = true;

			if (this.index+1>this.images.length-1){
				this.index=0;
			} else {
				++this.index;
			}

			this.resetAnimation();
		},4000);
	}

	deleteClass(){
		this.fadeIn = false;
		clearTimeout(this.r);
		clearInterval(this.t);
	}

	next(){
		this.fadeIn = true;
		this.r = setTimeout(()=>{
			this.fadeIn = false;
		},200);

		if (this.index+1>this.images.length-1){
			this.index=0;
		} else {
			++this.index;
		}

		this.startAnimation();
	}

	previous(){
		this.fadeIn = true;
		this.r = setTimeout(()=>{
			this.fadeIn = false;
		},200);

		if (this.index-1<0){
			this.index=this.images.length-1;
		} else {
			--this.index;
		}

		this.startAnimation();
	}

	changeNews(i){
		if (this.index!=i){
			this.fadeIn = true;
			this.r = setTimeout(()=>{
				this.fadeIn = false;
			},200);
		
			this.index = i;
			clearInterval(this.t);
			this.startAnimation();
		}
	}

	goToExternalUrl(url){
		window.location.href = url;
	}

	getUserService(){
		return this.userService;
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

	getRecommendedGames(){
		return this.gameService.getRecommendedGames();
	}

	getGamesData(){
		return this.gameService.getGamesData();
	}

	getCheapestStore(game){
		return game.stores.reduce((accumulator, currentValue)=>{
			return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
		})
	}

	deleteGameHistory(){
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

	showAllStores(game){
		this.selectedGame = game;
	}

	onClose(){
		this.selectedGame = null;
	}

}
