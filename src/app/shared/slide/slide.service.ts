import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Slide } from './slide';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class SlideService {

	constructor(
		private http: HttpClient,
		private userService: UserService
	) { }

	getSlides(){
		return this.http.get(environment.apiSlidesURL+'/');
	}

	createSlide(slide: Slide){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.post(environment.apiSlidesURL+'/createSlide',{slide: slide},{headers: headers});
	}

	editSlide(slide: Slide) {
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.put(environment.apiSlidesURL+'/editSlide/'+slide._id,{slide: slide},{headers: headers});
	}

	deleteSlide(_id: string){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.userService.getAccessToken()});
		return this.http.delete(environment.apiSlidesURL+'/deleteSlide/'+_id,{headers: headers});
	}
}
