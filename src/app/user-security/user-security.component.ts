import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-security',
  templateUrl: './user-security.component.html',
  styleUrls: ['./user-security.component.scss']
})
export class UserSecurityComponent implements OnInit {
	private propertiesToUpdate = {};
	user = {
		password: '',
		confirmPassword: ''
	};
	popupOpened: boolean=false;
	popupType: string;
	qrcodeImgSrc: string;
	code: string;
	type: string;

	constructor(
		private router: Router,
		private userService: UserService,
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		if (!this.userService.isAuthenticated()){
			this.router.navigate(['/login']);
		} else {
			this.userService.getMessages();
		}
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.updateUser({password : form.value.password});
	}

	updateUser(propertiesToUpdate: any){
		this.userService.updateUser(propertiesToUpdate).subscribe(
			(res: any)=>{
				this.getUserProfile();
				this.setPopup(false);
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.setPopup(false);
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	deleteProperties(propertiesToDelete: any){
		this.userService.deleteProperties(propertiesToDelete).subscribe(
			(res: any)=>{
				this.getUserProfile();
				this.setPopup(false);
				this.loadingScreenService.setAnimation(false);
			},
			(err)=>{
				this.setPopup(false);
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	toggleTwoFactor(authMethod: string){
		if (authMethod==='App'){
			if (this.userService.getUser().twoFactorGoogleEnabled){
				this.updateUser({twoFactorGoogleEnabled: false});
				this.deleteProperties({twoFactorGoogleSecret: 1});
			} else {
				this.type='appTwoFactor';
				this.loadingScreenService.setAnimation(true);
				this.userService.generateQRcode().subscribe(
					(res: any)=>{
						this.qrcodeImgSrc = res.qrcodeImgSrc;
						this.setPopup(true,'appTwoFactor');
						this.loadingScreenService.setAnimation(false);
					},
					(err)=>{
						this.loadingScreenService.setAnimation(false);
						this.userService.setErrorMessage(err.error.message);
					});
				}
		} else if (authMethod==='Email'){
			if (this.userService.getUser().twoFactorEmailEnabled){
				this.updateUser({twoFactorEmailEnabled: false});
				this.deleteProperties({twoFactorEmailSecret: 1});
			} else {
				this.type='emailTwoFactor';
				this.loadingScreenService.setAnimation(true);
				this.userService.generateEmailSecret().subscribe(
					(res: any)=>{
						console.log(res)
						this.setPopup(true,'emailTwoFactor')
						this.loadingScreenService.setAnimation(false);
					},
					(err)=>{
						this.loadingScreenService.setAnimation(false);
						this.userService.setErrorMessage(err.error.message);
					});
				}
		}
	}

	enableTwoFactor(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.enableTwoFactor(form.value).subscribe(
			(res: any)=>{
				if (res.type=='appTwoFactor'){
					this.updateUser({twoFactorGoogleEnabled: true});
				} else if (res.type=='emailTwoFactor'){
					this.updateUser({twoFactorEmailEnabled: true});
				} else if (res.type=='smsTwoFactor'){
					this.updateUser({twoFactorSMSEnabled: true});
				}
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
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

	untrustDevice(device){
		this.loadingScreenService.setAnimation(false);
		this.userService.untrustDevice(device).subscribe(
			(res:any)=>{
				this.loadingScreenService.setAnimation(false);
				this.getUserProfile();
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	setPopup(value: boolean,type?: string){
		this.popupOpened = value;
		if (type){
			this.popupType = type;
		}
	}

	isPopupOpened(){
		return this.popupOpened;
	}

	getUserService(){
		return this.userService;
	}

}
