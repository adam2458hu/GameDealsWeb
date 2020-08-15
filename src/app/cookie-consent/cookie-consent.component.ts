import { Component, OnInit } from '@angular/core';
import { CookieService } from '../shared/cookie/cookie.service';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {
	customize: boolean=false;
	device: boolean=false;
	geolocation: boolean=false;
	pushNotifications: boolean=false;
	recommendations: boolean= false;

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

	isGeolocationEnabled(){
		return this.geolocation;
	}

	areRecommendationsEnabled(){
		return this.recommendations;
	}

	arePushNotificationsEnabled(){
		return this.pushNotifications;
	}

	isDeviceEnabled(){
		return this.device;
	}

}
