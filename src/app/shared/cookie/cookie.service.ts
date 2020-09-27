import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
	cookieNames = {
		necessary : [],
		functional : ['lang','currency'],
		analytical : [],
		advertising : []
	};

	consent = {
		necessary : false,
		functional : false,
		analytical : false,
		advertising : false
	}

	constructor() {
	}

	consentToCookies(c){
		if (this.getConsent()) this.consent = this.getConsent();
		Object.keys(this.consent).forEach(type=>{
			if (this.consent[type]==true && c[type]==false){
				this.cookieNames[type].forEach(name=>{
					localStorage.removeItem(name);
				})
			}
		})
		this.consent.necessary=c.necessary;
		this.consent.functional=c.functional;
		this.consent.analytical=c.analytical;
		this.consent.advertising=c.advertising;
		this.setCookie("cookieConsent",JSON.stringify(this.consent));
	}

	setCookie(name: string, value: string){
		let date = new Date();
		date.setFullYear(date.getFullYear()+1);
		document.cookie = `${name}=${value}; expires=${date}; path=/`;
	}

	getCookie(name: string){
		let cookie={};
		/*az egyes süti adatok után szóköz van, ezért azokat eltávolítjuk a replac-szel,
		különben a süti nevek előtt egy szóköz szerepelne a splittel való feldarabolás után */
		document.cookie.replace(/\s/g,'').split(';').forEach(element=>{
			let key=element.split('=')[0];
			let value=element.split('=')[1];
			cookie[key]=value;
		});
		return cookie[name];
	}

	deleteCookie(name: string){
		let date = new Date();
		date.setFullYear(date.getFullYear()-1);
		document.cookie = `${name}=; expires=${date}; path=/;`;
	}

	getConsent(){
		/*let consent = this.getCookie('cookieConsent');
		if (consent) return JSON.parse(consent);
		else return false;*/
		let cookieConsent = this.getCookie('cookieConsent');
		if (cookieConsent) {
			this.consent = JSON.parse(cookieConsent);
		}
		return this.consent;
	}

	setLanguageCookie(lang){
		if (this.getConsent().functional){
			localStorage.setItem('lang',lang);
		}
	}

	getLanguageCookie(){
		return localStorage.getItem('lang');
	}

	setCurrencyCookie(currency){
		if (this.getConsent().functional){
			localStorage.setItem('currency',currency);
		}
	}

	getCurrencyCookie(){
		return localStorage.getItem('currency');
	}
}
