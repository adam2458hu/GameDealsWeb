import { Component, OnInit } from '@angular/core';
import { Slide } from '../shared/slide/slide';
import { SlideService } from '../shared/slide/slide.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../shared/language/language.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit {
	index;
	mobile: Boolean;
	editorOpened: Boolean;
	loadingImages;
	slides: Slide[];
	slideToEdit;
	scrollingInterval;
	fadeInTimeout;
	fadeIn: Boolean;
	months = {
		'hu' : ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'],
		'en' : ["January","February","March","April","May","June","July","August","September","October","November","December"]
	};

	constructor(
		private slideService: SlideService,
		private loadingScreenService: LoadingScreenService,
		private translateService: TranslateService,
		private languageService: LanguageService,
		private userService: UserService
	) { }

	ngOnInit() {
		this.editorOpened = false;
		this.index = 0;

		if (window.screen.width <= 992) {
      		this.mobile = true;
	    } else {
	    	this.mobile = false;
	    }

		this.getSlides();
	}

	getLanguage(){
		return this.languageService.getLanguage();
	}

	isMobile(){
		return this.mobile;
	}

	isAdmin(){
		return this.userService.isAdmin();
	}

	onCloseEditor(){
		this.editorOpened=false;
		if (this.slideToEdit) this.slideToEdit=null;
	}

	stopAutomaticSlideshow(){
		clearTimeout(this.fadeInTimeout);
		clearInterval(this.scrollingInterval);
	}

	startAutomaticSlideshow(){
		this.scrollingInterval = setInterval(()=>{
			this.resetFadeIn();

			if (this.index+1>this.slides.length-1){
				this.index=0;
			} else {
				++this.index;
			}

		},4000);
	}

	resetFadeIn(){
		//ez állítja le a fadeIn animációt ha lapozás közben az már folyamatban van
		this.fadeIn = false;
		//és ez kezdi előröl az animációt
		this.fadeIn = true;
		this.fadeInTimeout = setTimeout(()=>{
			this.fadeIn = false;
		},300);
	}

	next(){
		this.stopAutomaticSlideshow();
		this.resetFadeIn();

		if (this.index+1>this.slides.length-1){
			this.index=0;
		} else {
			++this.index;
		}
		
		this.startAutomaticSlideshow();
	}

	previous(){
		this.stopAutomaticSlideshow();
		this.resetFadeIn();

		if (this.index-1<0){
			this.index=this.slides.length-1;
		} else {
			--this.index;
		}

		this.startAutomaticSlideshow();
	}


	changeNews(i){
		if (this.index!=i){
			this.stopAutomaticSlideshow();
			this.resetFadeIn();
		
			this.index = i;
			this.startAutomaticSlideshow();
		}
	}

	getSlides(){
		this.slideService.getSlides().subscribe(
			(res: any)=>{
				this.slides = res.slides;
				this.slides.forEach(slide=>{
					slide.endOfOffer = new Date(slide.endOfOffer);
				})
				this.loadingImages = true;
				this.startAutomaticSlideshow();
			},
			(err)=>{
				console.log(err);
			})
	}

	editSlide(slide: Slide){
		this.slideToEdit = slide;
		this.editorOpened = true;
	}

	deleteSlide(_id: string){
		if (confirm(this.translateService.instant('confirmDelete'))) {
			this.loadingScreenService.setAnimation(true);
			this.slideService.deleteSlide(_id).subscribe(
				(res: any)=>{
					this.slides.filter(slide=>slide._id!==_id);
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		}
	}
}
