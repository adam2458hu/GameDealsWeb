import { Component, OnInit, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Game } from '../game/game';
import { Article } from '../shared/article/article';
import { UserService } from '../shared/user/user.service';
import { GameService } from '../game/game.service';
import { CurrencyService } from '../shared/currency/currency.service';
import { FilterService } from '../shared/filter/filter.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { LanguageService } from '../shared/language/language.service';
import { ArticleService } from '../shared/article/article.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
	mobile: Boolean;
	editorOpened: Boolean;
	index=0;
	numberOfWatchedGames=0;
	showViewedGenres=false;
	images: String[]=['nms','aco','ets2'];
	loadingImages = true;
	titles: String[]=["No Man's Sky",'Assassins Creed: Odyssey','Euro Truck Simulator 2'];
	discounts: String[]=['-50%','-67%','-75%'];
	endOfOffer: Date[]=[new Date(2020, 10, 5, 0, 0, 0, 0),new Date(2020, 7, 27, 0, 0, 0, 0),new Date(2020, 7, 27, 0, 0, 0, 0)];
	links: String[]=['https://store.steampowered.com/app/275850/No_Mans_Sky/',
	'https://store.steampowered.com/app/812140/Assassins_Creed_Odyssey/','https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'];
	t;
	articleToEdit;
	articles: Article[];
	topArticles: Article[];
	genreStatistics=[];
	uniqueWatchedGenres=[];
	r;
	fadeIn: Boolean;
	months = {
		'hu' : ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'],
		'en' : ["January","February","March","April","May","June","July","August","September","October","November","December"]
	};
	selectedGame: Game;

	constructor(
		private userService: UserService,
		private gameService: GameService,
		private currencyService: CurrencyService,
		private filterService: FilterService,
		private loadingScreenService: LoadingScreenService,
		private languageService: LanguageService,
		private articleService: ArticleService
	) { }

	ngAfterViewInit() {
	    if (window.screen.width <= 992) {
      		this.mobile = true;
	    } else {
	    	this.mobile = false;
	    }

		this.fadeIn = true;
		this.resetAnimation();
		this.startAnimation();
		this.gameService.resetGamesData();
		this.filterService.resetFilter();

		this.getArticles();
		this.getTopArticles();

		if (this.userService.isAuthenticated()){
			this.getRecommendedGamesByHistory();
			this.getGameHistory();
		}

		this.editorOpened = false;
	}

	isAdmin(){
		return this.userService.isAdmin();
	}

	isMobile(){
		return this.mobile;
	}

	onCloseEditor(){
		this.editorOpened=false;
		if (this.articleToEdit) this.articleToEdit=null;
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

	deleteFadeIn(){
		this.fadeIn = false;
		clearTimeout(this.r);
		clearInterval(this.t);
	}

	next(){
		this.deleteFadeIn();
		
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
		this.deleteFadeIn();
		
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

	getFilterService(){
		return this.filterService;
	}

	getArticles(){
		this.articleService.getArticles().subscribe(
			(res: any)=>{
				this.articles = res.articles;
			},
			(err)=>{
				console.log(err);
			})
	}

	editArticle(article: Article){
		this.articleToEdit = article;
		this.editorOpened = true;
	}

	deleteArticle(_id: string){
		if (confirm('Biztosan törölni szeretné?')) {
			this.loadingScreenService.setAnimation(true);
			this.articleService.deleteArticle(_id).subscribe(
				(res: any)=>{
					this.articles.filter(article=>article._id!==_id);
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		}
	}

	getTopArticles() {
		this.articleService.getTopArticles().subscribe(
			(res: any)=>{
				this.topArticles = res.topArticles;
			},
			(err)=>{
				console.log(err);
			})
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

	getLanguage(){
		return this.languageService.getLanguage();
	}

	getCheapestStore(game){
		return game.stores.reduce((accumulator, currentValue)=>{
			return (accumulator.specialPrice<currentValue.specialPrice)?accumulator:currentValue;
		})
	}

	currencyConverter(amount: number,from: String,to: String){
		return this.currencyService.currencyConverter(amount,from,to);
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
