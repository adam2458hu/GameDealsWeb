import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { SwPush } from '@angular/service-worker';
import { UserService } from './shared/user/user.service';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
	constructor(
		swPush: SwPush,
		private userService: UserService,
		private translateService: TranslateService,
		private titleService: Title
	) {
		this.translateService.setDefaultLang('en');
		this.translateService.use(localStorage.getItem('lang') || 'en');
		this.translateService.onLangChange.subscribe((res: string) => {
	      this.translateService.get('pageTitle').subscribe((res: string) => {
	        this.titleService.setTitle(res);
	      });
	    });

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
