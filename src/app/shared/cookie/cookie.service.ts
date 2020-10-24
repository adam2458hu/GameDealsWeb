import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
	cookieNames = {
		necessary : ['cookieConsent'],
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
					if (localStorage.getItem(name)) localStorage.removeItem(name);
				})
			}
		})
		this.consent.necessary=c.necessary;
		this.consent.functional=c.functional;
		this.consent.analytical=c.analytical;
		this.consent.advertising=c.advertising;
		if (!this.consent.analytical) window['ga-disable-UA-115370291-4'] = true;
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

	setPushNotificationConsent(value){
		this.setCookie('pushNotificationsAllowed',value);
	}

	getPushNotificationConsent(){
		return this.getCookie('pushNotificationsAllowed');
	}

	setAnalyticalCookies(){
		if (this.getConsent().analytical){
			let head = document.getElementsByTagName("head")[0];

			let analyticsScript = document.createElement("script");
			analyticsScript.text = 
			"window.dataLayer = window.dataLayer || [];"+
			"function gtag(){dataLayer.push(arguments);}"+
			"gtag('js', new Date());"+
			"gtag('config', 'UA-115370291-4');";
			head.insertBefore(analyticsScript, head.firstChild);

			let tagManagerScript = document.createElement("script");
			tagManagerScript.type = "text/javascript";
			tagManagerScript.src = "https://www.googletagmanager.com/gtag/js?id=UA-115370291-4";
			tagManagerScript.async = true;
			head.insertBefore(tagManagerScript,head.firstChild);
		} else {
			window['ga-disable-UA-115370291-4'] = true;
		}
	}

	setAdvertisingCookies(){
		if (this.getConsent().advertising){
			let adsenseScript = document.createElement("script");
			adsenseScript.type = "text/javascript";
			adsenseScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
			adsenseScript.async = true;
			adsenseScript.setAttribute("data-ad-client","ca-pub-7608652986167905");
			document.getElementsByTagName("head")[0].appendChild(adsenseScript);
		}
	}
}
