//import { Component, OnInit, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import { Component, OnInit} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Article } from '../shared/article/article';
import { UserService } from '../shared/user/user.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { LanguageService } from '../shared/language/language.service';
import { ArticleService } from '../shared/article/article.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
//export class HomeComponent implements AfterViewInit {
export class HomeComponent implements OnInit {
	editorOpened: Boolean;
	loadingImages: Boolean;
	articleToEdit;
	articles: Article[];
	topArticles: Article[];

	constructor(
		private userService: UserService,
		private loadingScreenService: LoadingScreenService,
		private languageService: LanguageService,
		private articleService: ArticleService,
		private translateService: TranslateService
	) { }

	ngOnInit() {
		this.loadingScreenService.setAnimation(true);
		this.loadingImages = true;
		this.editorOpened = false;

		this.getArticles();
		this.getTopArticles();
	}

	isAdmin(){
		return this.userService.isAdmin();
	}

	onCloseEditor(){
		this.editorOpened=false;
		if (this.articleToEdit) this.articleToEdit=null;
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

	onLoaded(){
		this.loadingImages=false
		this.loadingScreenService.setAnimation(false);
	}
}
