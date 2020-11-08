import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../shared/user/user.service';
import { GameService } from '../shared/game/game.service';
import { StoreService } from '../shared/store/store.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-user-admin',
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {
	pushNotificationText: String='';
	pushNotificationTitle: String='';
	messageText: String='';
	messageTitle: String='';
	messageType: String='deal';
	newsletterText: String='';
	newsletterTitle: String='';
	newsletterType: String="deals";
	IGDBAccessToken: String='';
	IGDBAccessTokenExpiresAt: Number;
	refreshIGDBData: Boolean=false;
	currentRefreshType: String;
	currentlyBeingRefreshed: String;
	refreshState: String='';
	interval: any = {
		days : null,
		hours : null,
		minutes : 30
	}
	stores: {name: String,isSelected: Boolean}[] = [];
	selectedStores: String[]=[];

	constructor(
		private userService: UserService,
		private gameService: GameService,
		private storeService: StoreService,
		private router: Router,
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		if (!this.userService.isAdmin()){
			this.router.navigate(['/login']);
		} else {
			this.userService.getMessages();
			this.getIGDBAccessToken();
			this.getRefreshDetails();
			this.getStores();
		}
	}

	sendNewsletters(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.sendNewsletters(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	sendMessages(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.sendMessages(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.getMessages();
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	sendPushNotifications(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.sendPushNotifications(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	getIGDBAccessToken(){
		this.loadingScreenService.setAnimation(true);
		this.gameService.getIGDBAccessToken().subscribe(
			(res: any)=>{
				this.IGDBAccessToken = res.IGDBAccessToken;
				this.IGDBAccessTokenExpiresAt = res.IGDBAccessTokenExpiresAt;
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	requestIGDBAccessToken(){
		this.loadingScreenService.setAnimation(true);
		this.gameService.requestIGDBAccessToken().subscribe(
			(res: any)=>{
				this.IGDBAccessToken = res.IGDBAccessToken;
				this.IGDBAccessTokenExpiresAt = res.IGDBAccessTokenExpiresAt;
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	getRefreshDetails(){
		this.loadingScreenService.setAnimation(true);
		this.gameService.getRefreshDetails().subscribe(
			(res: any)=>{
				this.currentRefreshType = res.currentRefreshType;
				this.currentlyBeingRefreshed = res.currentlyBeingRefreshed;
				this.refreshState = res.refreshState;
				this.refreshIGDBData = res.refreshIGDBData;
				this.setInterval(res.refreshInterval);
				this.stores.forEach(store=>{
					if (res.storesToRefresh.includes(store.name)) {
						store.isSelected = true;
					}
				});
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	refreshGamesOnce(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.stores.forEach(store=>{
			if (store.isSelected) this.selectedStores.push(store.name);
		})
		form.value.selectedStores = this.selectedStores;
		this.selectedStores = [];
		this.gameService.refreshGamesOnce(form.value).subscribe(
			(res: any)=>{
				this.currentRefreshType = res.currentRefreshType;
				this.currentlyBeingRefreshed = res.currentlyBeingRefreshed;
				this.refreshState = res.refreshState;
				this.refreshIGDBData = res.refreshIGDBData;
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	refreshGamesAutomatically(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.stores.forEach(store=>{
			if (store.isSelected) this.selectedStores.push(store.name);
		})
		form.value.selectedStores = this.selectedStores;
		this.selectedStores = [];
		this.gameService.refreshGamesAutomatically(form.value).subscribe(
			(res: any)=>{
				this.currentRefreshType = res.currentRefreshType;
				this.currentlyBeingRefreshed = res.currentlyBeingRefreshed;
				this.refreshState = res.refreshState;
				this.refreshIGDBData = res.refreshIGDBData;
				this.setInterval(res.refreshInterval);
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	stopRefresh(){
		this.loadingScreenService.setAnimation(true);
		this.gameService.stopRefresh().subscribe(
			(res: any)=>{
				this.currentRefreshType = res.currentRefreshType;
				this.currentlyBeingRefreshed = res.currentlyBeingRefreshed;
				this.refreshState = res.refreshState;
				this.setInterval(res.refreshInterval);
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	setInterval(interval) {
		let timeleft = interval;
		this.interval.days = Math.floor(timeleft/(1000*60*60*24));
		timeleft = timeleft%(1000*60*60*24);
		this.interval.hours = Math.floor(timeleft/(1000*60*60));
		timeleft = timeleft%(1000*60*60);
		this.interval.minutes = Math.floor(timeleft/(1000*60));
	}

	getStores(){
		this.storeService.getStores().forEach(store=>{
			this.stores.push({
				name: store.name,
				isSelected : false
			});
		})
	}

	isAdmin(){
		return this.userService.isAdmin();
	}

}
