import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { SwPush } from '@angular/service-worker';
import { DeviceDetectorService } from 'ngx-device-detector';
import { LoadingScreenService } from './shared/loading-screen/loading-screen.service';
import { CookieService } from './shared/cookie/cookie.service';
import { FilterService } from './shared/filter/filter.service';
import { UserService } from './shared/user/user.service';
import { LanguageService } from './shared/language/language.service';
import { CurrencyService } from './shared/currency/currency.service';
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
	availableLanguages;
	languageIsSet;
	serviceWorkerChecked;

	constructor(
		private swPush: SwPush,
		private cookieService: CookieService,
		private filterService: FilterService,
		private deviceDetectorService: DeviceDetectorService,
		private userService: UserService,
		private translateService: TranslateService,
		private titleService: Title,
		private languageService: LanguageService,
		private loadingScreenService: LoadingScreenService,
		private currencyService: CurrencyService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {		
		this.checkPushSubscription();
		this.setLanguageAndCookies();
		this.setPageTitle();

		this.continueSessionOrLoginRememberedUser();
	}

	checkPushSubscription(){
		//EZ A RÉSZ AZÉRT NAGYON FONTOS, MERT HA A SERVICE WORKER-t MÉG NEM HASZNÁLTUK
		//MIELŐTT OLYAN KOMPONENST HIVNÁNK MEG, AMI TARTALMAZZA A setTimeout VAGY setInterval()
		//METÓDUSOKAT, PÉLDÁUL A SLIDESHOW LÉPTETÉSÉHEZ HASZNÁLT METÓDUSOKAT,
		//AKKOR A SERVICE WORKER ÉS EZÁLTAL A PUSH ÉRTESÍTÉST ENGEDÉLYEZŐ PANEL NEM
		//FOG MŰKÖDÉSBE LÉPNI. HOGY EZ MIÉRT VAN ANNAK AZ OKÁT NEM TUDOM
		//EZÉRT A KOMPONENSEKET CSAK AKKOR JELENÍTJÜK MEG AZ app.component.html-ben,
		// HA A serviceWorkerChecked VÁLTOZÓ MÁR IGAZ
		this.serviceWorkerChecked = false;
		//ellenőrzi, hogy a böngészőben engedélyezve vannak e a push értesítések
		if (this.swPush.isEnabled) {
			//ellenőrzi, hogy az eszközhöz tartozik-e push értesítés feliratkozás
			this.swPush.subscription.subscribe(
			(pushSubscription: any)=>{
				if (!pushSubscription){
					this.swPush.requestSubscription({
						serverPublicKey: environment.PUBLIC_VAPID
			        })
			        .then(sub => this.userService.sendSubscriptionToTheServer(sub).subscribe())
			        .catch(err => console.error("Could not subscribe to notifications", err));
				}
				this.serviceWorkerChecked = true;
			},
			(err)=>{
				this.serviceWorkerChecked = true;
				console.log(err);
			})
		} else {
			this.serviceWorkerChecked = true;
		}
	}

	setLanguageAndCookies(){
		this.availableLanguages = this.languageService.getAvailableLanguages();

		this.cookieService.setAnalyticalCookies();
		this.cookieService.setAdvertisingCookies();

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
	}

	setPageTitle(){
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
							this.cookieService.setLanguageCookie(res.country_code2.toLowerCase());
							this.translateService.use(res.country_code2.toLowerCase());
						} else {
							this.languageService.setLanguage('en');
							this.cookieService.setLanguageCookie('en');
						}
						this.languageIsSet=true;
					},
					(err)=>{
						console.log(err);
					});
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			})
	}

	continueSessionOrLoginRememberedUser(){
		//ha a felhasználó már belépett, akkor a munkamenet folytatása
		if (this.cookieService.getCookie('refreshTokenSet')) {
			this.userService.refreshAccessToken().subscribe(
				(res: any)=>{
					this.userService.resetSession(res.accessToken);
					this.userService.setUserDetails();
				},
				(err)=>{
					console.log(err);
				})
		//ha engedélyezve van a rememberMe funkció, akkor a felhasználó beléptetése
		} else if (this.cookieService.getCookie('rememberMe')){
			this.loadingScreenService.setAnimation(true);
			this.userService.getDeviceInfoThenLogin(()=>{
				this.userService.loginRememberedUser().subscribe(
					(res: any)=>{
						this.userService.onSuccessfullLogin(res);
						this.loadingScreenService.setAnimation(false);
					},
					(err)=>{
						this.userService.setErrorMessage(err.error.message);
						this.loadingScreenService.setAnimation(false);
					});
			});
		}
	}
}
