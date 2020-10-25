//import { Component, OnInit, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import { Component, OnInit} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Article } from '../shared/article/article';
import { Slide } from '../shared/slide/slide';
import { UserService } from '../shared/user/user.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { LanguageService } from '../shared/language/language.service';
import { ArticleService } from '../shared/article/article.service';
import { SlideService } from '../shared/slide/slide.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
//export class HomeComponent implements AfterViewInit {
export class HomeComponent implements OnInit {
	mobile: Boolean;
	editorOpened: Boolean;
	animationStopped: Boolean;
	index=0;
	loadingImages = true;
	t;
	slides: Slide[];
	articleToEdit;
	articles: Article[];
	topArticles: Article[];
	r;
	fadeIn: Boolean;
	months = {
		'hu' : ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'],
		'en' : ["January","February","March","April","May","June","July","August","September","October","November","December"]
	};

	constructor(
		private userService: UserService,
		private loadingScreenService: LoadingScreenService,
		private languageService: LanguageService,
		private slideService: SlideService,
		private articleService: ArticleService,
		private translateService: TranslateService
	) { }

	ngOnInit() {
		if (window.screen.width <= 992) {
      		this.mobile = true;
	    } else {
	    	this.mobile = false;
	    }

		this.editorOpened = false;
		/*
		this.fadeIn = true;
		this.resetAnimation();
		this.startAnimation();*/

		this.getSlides();
		this.getArticles();
		this.getTopArticles();
	}

	/*ngAfterViewInit() {
	    if (window.screen.width <= 992) {
      		this.mobile = true;
	    } else {
	    	this.mobile = false;
	    }

		this.editorOpened = false;

		this.fadeIn = true;
		this.resetAnimation();
		this.startAnimation();

		this.getSlides();
		this.getArticles();
		this.getTopArticles();
	}*/

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

	/*resetAnimation(){
		this.r = setTimeout(()=>{
			this.fadeIn = false;
		},300);
	}

	startAnimation(){
		this.t = setInterval(()=>{
			this.fadeIn = true;

			if (this.index+1>this.slides.length-1){
				this.index=0;
			} else {
				++this.index;
			}

			this.resetAnimation();
		},4000);
	}*/
	startAnimation(index: any,slides: any){
		this.fadeIn = true;

		if (index+1>slides.length-1){
			index=0;
		} else {
			++index;
		}

		this.index=index;

		this.r=setTimeout(()=>{this.fadeIn=false},300);
		this.t=setTimeout(()=>{this.startAnimation(index,slides)},4000);
	}

	resetAnimation(){
		this.fadeIn = false;
		clearTimeout(this.r);
		clearTimeout(this.t);
		this.fadeIn = true;
	}

	next(){
		this.resetAnimation();
		if (this.index+1>this.slides.length-1){
			this.index=0;
		} else {
			++this.index;
		}


		this.r = setTimeout(()=>{this.fadeIn=false},300);
		this.t = setTimeout(()=>{this.startAnimation(this.index,this.slides)},4000);
	}

	previous(){
		this.resetAnimation();

		if (this.index-1<0){
			this.index=this.slides.length-1;
		} else {
			--this.index;
		}

		this.r = setTimeout(()=>{this.fadeIn=false},300);
		this.t = setTimeout(()=>{this.startAnimation(this.index,this.slides)},4000);
	}


	changeNews(i){
		if (this.index!=i){
			this.resetAnimation();
			
			this.index = i;

			this.r = setTimeout(()=>{this.fadeIn=false},300);
			this.t = setTimeout(()=>{this.startAnimation(this.index,this.slides)},4000);
		}
	}

	/*
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

		if (this.index+1>this.slides.length-1){
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
			this.index=this.slides.length-1;
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
	}*/

	getSlides(){
		this.slideService.getSlides().subscribe(
			(res: any)=>{
				this.slides = res.slides;
				this.slides.forEach(slide=>{
					slide.endOfOffer = new Date(slide.endOfOffer);
				})
				this.startAnimation(this.index,this.slides);
			},
			(err)=>{
				console.log(err);
			})
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

	getArticlePropertyTextByLang(article,property){
		return article[property].filter(propertyObject=>propertyObject.lang==this.languageService.getLanguage())[0].text;
	}

	editArticle(article: Article){
		this.articleToEdit = article;
		this.editorOpened = true;
	}

	deleteArticle(_id: string){
		if (confirm(this.translateService.instant('confirmDelete'))) {
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

	getLanguage(){
		return this.languageService.getLanguage();
	}

}
