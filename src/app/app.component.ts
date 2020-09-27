import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { SwPush } from '@angular/service-worker';
import { CookieService } from './shared/cookie/cookie.service';
import { UserService } from './shared/user/user.service';
import { LanguageService } from './shared/language/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
	//languageCookieIsSet = false;
	availableLanguages = ['en','hu'];
	languageIsSet;

	constructor(
		private swPush: SwPush,
		private cookieService: CookieService,
		private userService: UserService,
		private translateService: TranslateService,
		private titleService: Title,
		private languageService: LanguageService
	) {
		console.log(swPush.isEnabled);
		/*if (swPush.isEnabled) {
		  	swPush.requestSubscription({
		      serverPublicKey: environment.PUBLIC_VAPID
		    })
		    .then(subscription => {
		    	console.log(subscription);
		      this.userService.sendSubscriptionToTheServer(subscription).subscribe()
		    })
		    .catch(console.error)
		}*/
		if (this.swPush.isEnabled) {
			this.swPush.requestSubscription({
				serverPublicKey: environment.PUBLIC_VAPID
	        })
	        .then(sub => this.userService.sendSubscriptionToTheServer(sub).subscribe())
	        .catch(err => console.error("Could not subscribe to notifications", err));
		}

		this.languageIsSet=false;
		this.translateService.setDefaultLang('en');
		this.translateService.onLangChange.subscribe((res: string) => {
	      this.translateService.get('pageTitle').subscribe((res: string) => {
	        this.titleService.setTitle(res);
	      });
	    });

		/*
	    if (this.cookieService.getConsent() && this.cookieService.getConsent().functional){
	    	console.log("beleegyezett");
			if (!localStorage.getItem('lang')) this.requestLanguage();
			else {
				this.languageService.setLanguage(localStorage.getItem('lang'));
				this.translateService.use(localStorage.getItem('lang'));
			}
	    } else {
	    	console.log("nem egyezett bele");
	    	this.languageService.setLanguage('en');
	    	this.translateService.use('en');
	    }*/
		if (!this.cookieService.getLanguageCookie()) this.requestLanguage();
		else {
			this.languageService.setLanguage(this.cookieService.getLanguageCookie());
			this.translateService.use(this.cookieService.getLanguageCookie());
			this.languageIsSet=true;
		}

		if (this.userService.isAuthenticated()){
			this.getUserProfile();
			this.userService.getMessages();
		}
	}

	subscribeToNotifications() {
        this.swPush.requestSubscription({
            serverPublicKey: environment.PUBLIC_VAPID
        })
        .then(sub => this.userService.sendSubscriptionToTheServer(sub).subscribe())
        .catch(err => console.error("Could not subscribe to notifications", err));
    }

	requestLanguage(){
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
				this.userService.getGeoLocation(res.ip).subscribe(
					(res: any)=>{
						// ha a felhasználó elfogadta a sütiket csak akkor állítjuk be a nyelv sütit
						if (this.availableLanguages.includes(res.country_code2.toLowerCase())){
							this.languageService.setLanguage(res.country_code2.toLowerCase());
							//localStorage.setItem('lang',res.country_code2.toLowerCase());
							this.cookieService.setLanguageCookie(res.country_code2.toLowerCase());
							//window.location.reload();
							this.translateService.use(res.country_code2.toLowerCase());
						} else {
							this.languageService.setLanguage('en');
							this.cookieService.setLanguageCookie('en');
							//localStorage.setItem('lang','en');
						}
						this.languageIsSet=true;
						//this.languageCookieIsSet=true;
					},
					(err)=>{
						console.log(err);
					});
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			})
	}

	getUserProfile(){
		this.userService.getUserProfile().subscribe(
			(res: any)=>{
				this.userService.setUser(res.user);
				this.userService.resetSession(res.accessToken);
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			});
	}
}
