import { Component, ViewChild, OnInit } from '@angular/core';
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
export class UserLoginComponent implements OnInit {
	@ViewChild('loginForm',null) loginFormElement: NgForm;
	user = {
		_id: '',
		email: '',
		password: '',
		rememberMe: false
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
		private currencyService: CurrencyService
	) { }

	ngOnInit() {
	  	if (this.userService.isAuthenticated()){
	  		this.router.navigate(['/deals']);
	  	} else if (localStorage.getItem('rememberMe')){
			this.user.email = localStorage.getItem('email');
			this.user.password = localStorage.getItem('password');
			this.user.rememberMe = true;

			setTimeout(()=>{
				this.loginFormElement.setValue(this.user);
				this.loginFormElement.ngSubmit.emit();
			})
		}
	}

	getUserProfile(){
		this.userService.getUserProfile().subscribe(
			(res: any)=>{
				this.userService.setUser(res.user);
				this.userService.resetSession(res.accessToken);
				this.router.navigate(['/deals']).then(()=>{
					this.userService.setSuccessMessage('Sikeres bejelentkezés');
				});
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			});
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);

		if (form.value.rememberMe){
			localStorage.setItem('email',form.value.email);
			localStorage.setItem('password',form.value.password);
			localStorage.setItem('rememberMe',form.value.rememberMe);
		} else {
			localStorage.removeItem('email');
			localStorage.removeItem('password');
			localStorage.removeItem('rememberMe');
		}

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
					//this.userService.setUser(form.value);
					this.userService.setAccessToken(res.accessToken);
					this.userService.setRefreshToken(res.refreshToken);
					this.userService.startSessionCountdown();
					this.getIPAddress();
					this.getUserProfile();
					/*this.router.navigate(['/deals']).then(()=>{
						this.userService.setSuccessMessage('Sikeres bejelentkezés');
					});*/
				} else if (res.emailVerified!=null && !res.emailVerified){
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
	}

	getIPAddress(){
		this.loadingScreenService.setAnimation(true);
		this.userService.getIPAddress().subscribe(
			(res: any)=>{
				let loginDetails: any = this.deviceDetectorService.getDeviceInfo();
				loginDetails.ip = res.ip;
				loginDetails.date = new Date();
				loginDetails.windowWidth = window.innerWidth;
				loginDetails.windowHeight = window.innerHeight;

				this.userService.saveLoginDetails(loginDetails).subscribe(
					(res: any)=>{
					},
					(err)=>{
						console.log(err);
					})
				this.getGeoLocation(res.ip);
			},
			(err)=>{
				console.log(err);
				this.loadingScreenService.setAnimation(false);
			});
	}

	getGeoLocation(ip: string){
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
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				console.log(err);
			});
	}

	verifyTwoFactorCode(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.verifyTwoFactorCode(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				//this.userService.setUser(form.value);
				this.userService.setAccessToken(res.accessToken);
				this.userService.setRefreshToken(res.refreshToken);
				this.userService.startSessionCountdown();
				this.getUserProfile();
				/*this.router.navigate(['/deals']).then(()=>{
					this.userService.setSuccessMessage('Sikeres bejelentkezés');
				});*/
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
