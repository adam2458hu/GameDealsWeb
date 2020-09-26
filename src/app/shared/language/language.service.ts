import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
	lang: String;

	constructor() { }

	setLanguage(lang){
		this.lang = lang;
	}

	getLanguage(){
		return this.lang;
	}
}
