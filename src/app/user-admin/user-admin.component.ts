import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../shared/user/user.service';
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

	constructor(
		private userService: UserService,
		private router: Router,
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		if (!this.userService.isAdmin()){
			this.router.navigate(['/login']);
		} else {
			this.userService.getMessages();
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

	isAdmin(){
		return this.userService.isAdmin();
	}

}
