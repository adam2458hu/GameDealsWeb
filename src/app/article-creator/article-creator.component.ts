import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ArticleService } from '../shared/article/article.service';
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
	article = {
		title : '',
		slug: '',
		lead: '',
		body: '',
		image: ''
	}


	constructor(
		private articleService: ArticleService,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService
	) { }

	ngOnInit() {
		if (this.articleToEdit) this.article = this.articleToEdit;
		window.scrollTo(0,document.getElementById("editor").offsetTop-document.getElementById("navbar").scrollHeight);
	}

	onClose(){
		this.close.emit();
	}

	onSubmit(form: NgForm){
		if (!this.articleToEdit) {
			this.loadingScreenService.setAnimation(true);
			this.articleService.createArticle(form.value).subscribe(
				(res: any)=>{
					this.onClose();
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		} else {
			form.value._id=this.articleToEdit._id;
			this.loadingScreenService.setAnimation(true);
			this.articleService.editArticle(form.value).subscribe(
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
