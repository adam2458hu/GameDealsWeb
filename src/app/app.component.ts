import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { SwPush } from '@angular/service-worker';
import { CookieService } from './shared/cookie/cookie.service';
import { UserService } from './shared/user/user.service';
import { LanguageService } from './shared/language/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter, map } from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
	availableLanguages = ['en','hu'];
	languageIsSet;

	constructor(
		private swPush: SwPush,
		private cookieService: CookieService,
		private userService: UserService,
		private translateService: TranslateService,
		private titleService: Title,
		private languageService: LanguageService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {

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

		this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => {
                let child = this.activatedRoute.firstChild;
                while (child) {
                    if (child.firstChild) {
                        child = child.firstChild;
                    } else if (child.snapshot.data && child.snapshot.data['title']) {
                        return child.snapshot.data['title'];
                    } else {
                        return null;
                    }
                }
                return null;
            })
        ).subscribe( (data: any) => {
            if (data) {
                this.translateService.get(data).subscribe((res: string) => {
			        this.titleService.setTitle(data!=='pageTitle'?res+' | Game Deals Web':res);
			      });
            }
        });
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
