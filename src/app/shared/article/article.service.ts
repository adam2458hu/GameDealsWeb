import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Article } from './article';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

	constructor(
		private http: HttpClient,
		private userService: UserService
	) { }

	getArticles(){
		return this.http.get(environment.apiArticlesURL+'/');
	}

	getTopArticles(){
		return this.http.get(environment.apiArticlesURL+'/getTopArticles');
	}

	getArticleBySlug(slug: string){
		return this.http.get(environment.apiArticlesURL+'/getArticleBySlug/'+slug);
	}

	articleViewed(_id: string){
		return this.http.get(environment.apiArticlesURL+'/articleViewed/'+_id);
	}

	createArticle(article: Article){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiArticlesURL+'/createArticle',{article: article},{headers: headers});
	}

	editArticle(article: Article) {
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.put(environment.apiArticlesURL+'/editArticle/'+article._id,{article: article},{headers: headers});
	}

	deleteArticle(_id: string){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.delete(environment.apiArticlesURL+'/deleteArticle/'+_id,{headers: headers});
	}
}
