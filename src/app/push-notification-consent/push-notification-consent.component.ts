import { Component, OnInit } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../environments/environment';
import { UserService } from '../shared/user/user.service';
import { CookieService } from '../shared/cookie/cookie.service';

@Component({
  selector: 'app-push-notification-consent',
  templateUrl: './push-notification-consent.component.html',
  styleUrls: ['./push-notification-consent.component.scss']
})
export class PushNotificationConsentComponent implements OnInit {
	consented: boolean;

	constructor(
		private userService: UserService,
		private cookieService: CookieService,
		private swPush: SwPush
	) { }

	ngOnInit() {
		this.consented=this.getPushNotificationConsent();
	}

	getPushNotificationConsent(){
		return this.cookieService.getPushNotificationConsent();
	}

	deny(){
		this.consented=true;
		this.cookieService.setPushNotificationConsent(false);
	}

	allow(){
		this.consented=true;
		this.cookieService.setPushNotificationConsent(true);
		//ellenőrzi, hogy a böngészőben engedélyezve vannak e a push értesítések
		if (this.swPush.isEnabled) {
			//ellenőrzi, hogy az eszközhöz tartozik-e push értesítés feliratkozás
			this.swPush.subscription.subscribe(
			(pushSubscription: any)=>{
				//ha nem, akkor megkérdezzük a látogatót, akar e push értesítést fogadni
				if (!pushSubscription){
					this.swPush.requestSubscription({
						serverPublicKey: environment.PUBLIC_VAPID
			        })
			        .then(sub => this.userService.sendSubscriptionToTheServer(sub).subscribe())
			        .catch(err => console.error("Could not subscribe to notifications", err));
				}
			},
			(err)=>{
				console.log(err);
			})
		}
	}

}
