import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { SwPush } from '@angular/service-worker';
import { CookieService } from './shared/cookie/cookie.service';
import { UserService } from './shared/user/user.service';
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

	constructor(
		swPush: SwPush,
		private cookieService: CookieService,
		private userService: UserService,
		private translateService: TranslateService,
		private titleService: Title
	) {

		this.translateService.setDefaultLang('en');
		this.translateService.onLangChange.subscribe((res: string) => {
	      this.translateService.get('pageTitle').subscribe((res: string) => {
	        this.titleService.setTitle(res);
	      });
	    });

	    if (this.cookieService.getConsent().functional){
			if (!localStorage.getItem('lang')) this.setLanguageCookie();
			else this.translateService.use(localStorage.getItem('lang'));
	    } else {
	    	this.translateService.use('en');
	    }

		if (swPush.isEnabled) {
		  swPush
		    .requestSubscription({
		      serverPublicKey: environment.PUBLIC_VAPID
		    })
		    .then(subscription => {
		    	console.log(subscription);
		      this.userService.sendSubscriptionToTheServer(subscription).subscribe()
		    })
		    .catch(console.error)
		}

		if (this.userService.isAuthenticated()){
			this.getUserProfile();
			this.userService.getMessages();
		}
	}

	setLanguageCookie(){
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
				this.userService.getGeoLocation(res.ip).subscribe(
					(res: any)=>{
						// ha a felhasználó elfogadta a sütiket csak akkor állítjuk be a nyelv sütit
						if (this.availableLanguages.includes(res.country_code2.toLowerCase())){
							localStorage.setItem('lang',res.country_code2.toLowerCase());
							//window.location.reload();
						} else {
							localStorage.setItem('lang','en');
						}
						this.translateService.use(res.country_code2.toLowerCase());
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
