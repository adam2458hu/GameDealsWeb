import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from '../shared/article/article.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit {
	private article;
	srcSafe;
	
	constructor(
		private articleService: ArticleService,
		private route: ActivatedRoute,
		private userService: UserService,
		public sanitizer: DomSanitizer
	) { }

	ngOnInit() {
		this.getArticleBySlug(this.route.snapshot.paramMap.get('slug'));
	}

	getArticleBySlug(slug: string) {
		this.articleService.getArticleBySlug(slug).subscribe(
			(res: any)=>{
				this.article = res.article;
				this.srcSafe = this.sanitizer.bypassSecurityTrustResourceUrl("https://www.facebook.com/plugins/like.php?href="+environment.siteURL+"/articles/"+this.article.slug+"&width=100&layout=standard&action=like&size=small&share=true&height=35&appId");
				if (!this.userService.isAdmin()) {
					this.articleViewed(this.article._id);
				}
			},
			(err)=>{
				console.log(err);
			})
	}

	articleViewed(_id: string){
		this.articleService.articleViewed(_id).subscribe(
			(res: any)=>{
			},
			(err)=>{
				console.log(err);
			})
	}
}
