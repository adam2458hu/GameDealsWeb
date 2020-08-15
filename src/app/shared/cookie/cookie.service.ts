import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
	private consented: boolean=true;

	constructor() { }

	set(name: string, value: string){
		let date = new Date();
		date.setFullYear(date.getFullYear()+1);
		document.cookie = `${name}=${value}; expires=${date}; path=/`;
	}

	delete(name: string){
		let date = new Date();
		date.setFullYear(date.getFullYear()-1);
		document.cookie = `${name}=; expires=${date}; path=/;`;
	}

	isConsented(){
		return this.consented;
	}
}
