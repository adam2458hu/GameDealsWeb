import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
	lang: string;
	availableLanguages: String[] = ['en','hu'];

	constructor() { }

	setLanguage(lang){
		this.lang = lang;
	}

	getLanguage(){
		return this.lang;
	}

	getAvailableLanguages(){
		return this.availableLanguages;
	}
}
