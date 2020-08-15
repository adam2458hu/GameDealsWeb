import { Component, OnInit } from '@angular/core';
import { CookieService } from '../shared/cookie/cookie.service';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {
	private customize: boolean=false;
	private device: boolean=false;
	private geolocation: boolean=false;
	private pushNotifications: boolean=false;
	private recommendations: boolean= false;

	constructor(private cookieService: CookieService) { }

	ngOnInit() {
	}

	isConsented(){
		return this.cookieService.isConsented();
	}

	customizeCookies(){
		this.customize = !this.customize;
	}

	toggleRecommendations(){
		this.recommendations = !this.recommendations;
	}

	saveSettings(){
		this.customizeCookies();
	}

}
