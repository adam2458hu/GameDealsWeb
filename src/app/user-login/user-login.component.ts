import { Component, ViewChild, AfterViewChecked } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';
import { CookieService } from '../shared/cookie/cookie.service';
import { FilterService } from '../shared/filter/filter.service';
import { CurrencyService } from '../shared/currency/currency.service';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements AfterViewChecked {
	@ViewChild('loginForm',null) loginFormElement: NgForm;
	user = {
		_id: '',
		email: '',
		password: '',
		rememberMe: false,
		rememberDevice: false
	}
	popupOpened: boolean=false;
	popupType: string;
	qrcodeImgSrc: string;
	code: string;
	verificationCode: string;
	type: string;

	constructor(
		private router: Router,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService,
		private filterService: FilterService,
		private deviceDetectorService: DeviceDetectorService,
		private currencyService: CurrencyService,
		private cookieService: CookieService
	) { }

	ngAfterViewChecked(){
	  	if (this.userService.isAuthenticated()){
	  		this.router.navigate(['/deals']);
		}
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.getDeviceInfoThenLogin(()=>{
			form.value.ip=this.userService.getLoginDetails().ip;
			this.userService.loginUser(form.value).subscribe(
				(res: any)=>{
					if (res.accessToken){
						this.userService.onSuccessfullLogin(res);
					} else if (res.multipleTwoFactorEnabled) {
						this.userService.setTempAccessToken(res.tempAccessToken);
						this.setPopup(true,'twoFactorMethod');
					} else if (res.twoFactorGoogleEnabled){
						this.userService.setTempAccessToken(res.tempAccessToken);
						this.setPopup(true,'appTwoFactor');
					} else if (res.twoFactorEmailEnabled){
						this.userService.setTempAccessToken(res.tempAccessToken);
						this.setPopup(true,'emailTwoFactor');
					} else if (res.emailVerified!=null && !res.emailVerified){
						this.userService.setErrorMessage(res.message);
						this.setPopup(true,'verificationRequired');
					} else {
						this.userService.setErrorMessage(res.message);
					}
					this.loadingScreenService.setAnimation(false);
				},
				(err)=>{
					this.userService.setErrorMessage(err.error.message);
					this.loadingScreenService.setAnimation(false);
			});
		},form);
	}

	verifyTwoFactorCode(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		if (form.value.rememberDevice) {
			form.value.ip=this.userService.getLoginDetails().ip;
			form.value.country = this.userService.getLoginDetails().country;
		}
		this.userService.verifyTwoFactorCode(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.onSuccessfullLogin(res);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	resendVerificationLink(email: String){
		this.setPopup(false);
		this.loadingScreenService.setAnimation(true);
		this.userService.resendVerificationLink(email).subscribe(
			(res: any)=>{
		    	this.loadingScreenService.setAnimation(false);
		  		this.userService.setSuccessMessage(res.message);
		    	this.router.navigate(['/']);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			}
		);
	}

	selectTwoFactorMethod(form: NgForm){
		if (form.value.authMethod=='emailTwoFactor') {
			this.userService.sendTwoFactorEmail().subscribe(
				(res: any)=>{
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.userService.setErrorMessage(err.error.message);
				}
			);
		};
		this.setPopup(true,form.value.authMethod);
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
}
