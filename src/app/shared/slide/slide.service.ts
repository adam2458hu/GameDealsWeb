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
}
