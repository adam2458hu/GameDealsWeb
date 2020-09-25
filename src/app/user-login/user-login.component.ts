import { Component, ViewChild, AfterViewChecked } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';
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
	loginDetails: any;

	constructor(
		private router: Router,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService,
		private filterService: FilterService,
		private deviceDetectorService: DeviceDetectorService,
		private currencyService: CurrencyService
	) { }

	ngAfterViewChecked(){
	  	if (this.userService.isAuthenticated()){
	  		this.router.navigate(['/deals']);
	  	} else if (localStorage.getItem('rememberMeToken')){
			this.loginRememberedUser();
		}
	}

	getUserProfile(){
		this.userService.getUserProfile().subscribe(
			(res: any)=>{
				this.userService.setUser(res.user);
				//this.userService.resetSession(res.accessToken);
				this.router.navigate(['/deals']).then(()=>{
					//this.userService.setSuccessMessage('Sikeres bejelentkezés');
				});
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			});
	}

	loginRememberedUser(){
		this.loadingScreenService.setAnimation(true);
		this.userService.loginRememberedUser().subscribe(
			(res: any)=>{
				if (res.accessToken){
					//this.userService.setAccessToken(res.accessToken);
					//this.userService.setRefreshToken(res.refreshToken);
					//this.userService.startSessionCountdown();
					this.getIPAddress();
					this.getUserProfile();
				}
				this.loadingScreenService.setAnimation(false);
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
				this.loadingScreenService.setAnimation(false);
			});
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.getDeviceInfoThenLogin(()=>{
			form.value.ip=this.loginDetails.ip;
			this.userService.loginUser(form.value).subscribe(
				(res: any)=>{
					if (res.multipleTwoFactorEnabled) {
						this.userService.setTempToken(res.tempAccessToken);
						this.setPopup(true,'twoFactorMethod');
					} else if (res.twoFactorGoogleEnabled){
						this.userService.setTempToken(res.tempAccessToken);
						this.setPopup(true,'appTwoFactor');
					} else if (res.twoFactorEmailEnabled){
						this.userService.setTempToken(res.tempAccessToken);
						this.setPopup(true,'emailTwoFactor');
					} else if (res.accessToken){
						this.userService.setSuccessMessage(res.message);
						this.userService.setRefreshToken(res.refreshToken);
						if (res.rememberMeToken){
							this.userService.setRememberMeToken(res.rememberMeToken);
						}
						this.userService.resetSession(res.accessToken);
						this.userService.saveLoginDetails(this.loginDetails).subscribe(
							(res: any)=>{
								this.getUserProfile();
							},
							(err)=>{
								console.log(err);
							})
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

	getDeviceInfoThenLogin(loginFunction,form){
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
				this.loginDetails = this.deviceDetectorService.getDeviceInfo();
				this.loginDetails.ip = res.ip;
				this.loginDetails.date = new Date();
				this.loginDetails.windowWidth = window.innerWidth;
				this.loginDetails.windowHeight = window.innerHeight;
				this.userService.getGeoLocation(res.ip).subscribe(
					(res: any)=>{
						this.loginDetails.country = res.country_name;
						loginFunction(form);
					},
					(err)=>{
						console.log(err);
					});
			},
			(err)=>{
				console.log(err);
			});
	}
	/*getLoginDetails(){
		this.loadingScreenService.setAnimation(true);
		this.login = this.deviceDetectorService.getDeviceInfo();
		loginDetails.date = new Date();
		loginDetails.windowWidth = window.innerWidth;
		loginDetails.windowHeight = window.innerHeight;
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
				loginDetails.ip = res.ip;
				this.getGeoLocation(loginDetails,res.ip);
			},
			(err)=>{
				console.log(err);
				this.loadingScreenService.setAnimation(false);
			});
	}*/

	getIPAddress(){
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
			},
			(err)=>{
				console.log(err);
			});
	}

	getGeoLocation(loginDetails: any,ip: string){
		this.userService.getGeoLocation(ip).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.currencyService.getCurrencies().forEach(currency=>{
					if (currency.name==res.currency.code){
						this.filterService.filter.currency = res.currency.code;
						this.filterService.filter.symbol = currency.symbol;
						this.filterService.filter.decimalPlaces = currency.decimalPlaces;
					}
				})
				loginDetails.country = res.country_name;
				this.userService.saveLoginDetails(loginDetails).subscribe(
					(res: any)=>{
					},
					(err)=>{
						console.log(err);
					})
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				console.log(err);
			});
	}

	/*verifyTwoFactorCode(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.verifyTwoFactorCode(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setAccessToken(res.accessToken);
				this.userService.setRefreshToken(res.refreshToken);
				this.userService.startSessionCountdown();
				this.getUserProfile();
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}*/

	verifyTwoFactorCode(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		if (form.value.rememberDevice) {
			form.value.ip=this.loginDetails.ip;
			form.value.country = this.loginDetails.country;
		}
		this.userService.verifyTwoFactorCode(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setRefreshToken(res.refreshToken);
				this.userService.resetSession(res.accessToken);
				this.userService.saveLoginDetails(this.loginDetails).subscribe(
					(res: any)=>{
						this.getUserProfile();
					},
					(err)=>{
						console.log(err);
					})
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
