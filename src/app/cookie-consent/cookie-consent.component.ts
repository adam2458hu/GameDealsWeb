import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Consent } from '../shared/cookie/consent';
import { CookieService } from '../shared/cookie/cookie.service';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {
	consented: boolean;
	popupOpened: boolean;
	settingsPanelOpened: boolean;
	consent: Consent;

	constructor(
		private cookieService: CookieService,
		private router: Router
	) { }

	ngOnInit() {
		this.consent = new Consent(true,true,true,false);
		if (this.cookieService.getConsent().necessary) {
			this.consented = true;
			this.consent = this.cookieService.getConsent();
			this.popupOpened = false;
		} else {
			this.consented = false;
			this.consent.necessary = true;
			this.consent.functional = false;
			this.consent.analytical = false;
			this.consent.advertising = false;
			this.popupOpened = true;
		}
		this.settingsPanelOpened = false;
	}

	getRouter(){
		return this.router;
	}

	consentToNecessaryCookies(){
		this.consent.necessary = true;
		this.consent.functional = false;
		this.consent.analytical = false;
		this.consent.advertising = false;
		this.cookieService.consentToCookies(this.consent);
		this.consented = true;
		this.popupOpened = false;
	}

	consentToCustomCookies(form: NgForm){
		this.cookieService.consentToCookies(form.value);
		this.consented = true;
		this.popupOpened = false;
	}

	consentToAllCookies(){
		this.consent.necessary = true;
		this.consent.functional = true;
		this.consent.analytical = true;
		this.consent.advertising = false;
		this.cookieService.consentToCookies(this.consent);
		this.consented = true;
		this.popupOpened = false;
	}

	togglePopup(){
		this.popupOpened = !this.popupOpened;
	}

	toggleSettingsPanel(){
		this.settingsPanelOpened = !this.settingsPanelOpened;
	}
}
