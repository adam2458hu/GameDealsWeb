import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
	lang: string;

	constructor() { }

	setLanguage(lang){
		this.lang = lang;
	}

	getLanguage(){
		return this.lang;
	}
}
