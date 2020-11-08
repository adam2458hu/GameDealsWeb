import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Article } from '../shared/article/article';
import { ArticleService } from '../shared/article/article.service';
import { LanguageService } from '../shared/language/language.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-article-creator',
  templateUrl: './article-creator.component.html',
  styleUrls: ['./article-creator.component.scss']
})
export class ArticleCreatorComponent implements OnInit {
	@Input() editorOpened: boolean;
	@Output() created = new EventEmitter();
	@Output() close = new EventEmitter();
	@Input() articleToEdit;
	article;
	availableLanguages: String[];
	selectedLanguageIndex=1;


	constructor(
		private articleService: ArticleService,
		private loadingScreenService: LoadingScreenService,
		private languageService: LanguageService,
		private userService: UserService
	) { }

	ngOnInit() {
		this.availableLanguages = this.languageService.getAvailableLanguages();
		if (this.articleToEdit) this.article = this.articleToEdit;
		else this.article = new Article(this.availableLanguages);

		setTimeout(()=>{
			window.scrollTo(0,document.getElementById("editor").offsetTop-document.getElementById("navbar").scrollHeight);
		});
	}

	onClose(){
		this.close.emit();
	}

	onSubmit(form: NgForm){
		if (!this.articleToEdit) {
			this.loadingScreenService.setAnimation(true);
			this.articleService.createArticle(this.article).subscribe(
				(res: any)=>{
					this.created.emit();
					this.onClose();
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		} else {
			this.loadingScreenService.setAnimation(true);
			this.articleService.editArticle(this.article).subscribe(
				(res: any)=>{
					this.onClose();
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
