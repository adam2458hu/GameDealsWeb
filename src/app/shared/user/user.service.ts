import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CookieService } from '../cookie/cookie.service';
import { Router } from '@angular/router';
import { User } from './user';
import { LoginDetails } from '../login-details/login-details';

@Injectable({
  providedIn: 'root'
})
export class UserService {
	private accessToken: string;
	private tempAccessToken: string;
	private errorMessage: string;
	private successMessage: string;
	private maxIdleInMilisecs: number=60000;
	private timeLeftInMilisecs: number;
	private timeLeftAsString: String;
	private sessionRefreshInterval: number;
	private authorizedToPasswordReset: boolean;
	private messages;
	private messagesUnread;
	private user: User;
	private loginDetails: any;

	constructor(
		private http: HttpClient,
		private router: Router,
		private cookieService: CookieService,
		private deviceDetectorService: DeviceDetectorService
	) { }

	registerUser(user: User){
		return this.http.post(environment.apiUsersURL+'/register',user);
	}

	verifyEmail(token: string){
		return this.http.get(environment.apiUsersURL+'/verifyEmail/'+token);
	}

	trustDevice(token: string){
		return this.http.get(environment.apiUsersURL+'/trustDevice/'+token);
	}

	untrustDevice(device: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/untrustDevice',{device: device},{headers:headers});
	}

	verifyDataRequest(token: string){
		return this.http.get(environment.apiUsersURL+'/verifyDataRequest/'+token);
	}

	resendVerificationLink(email: String){
		return this.http.post(environment.apiUsersURL+'/resendVerificationLink',{email: email});
	}

	loginUser(user: User){
		return this.http.post(environment.apiUsersURL+'/login',user,{withCredentials: true});
	}

	loginRememberedUser(){
		//var headers = new HttpHeaders({'authorization':'Bearer '+this.getRememberMeToken()});
		return this.http.get(environment.apiUsersURL+'/loginRememberedUser',{withCredentials: true});
	}

	getIPAddress(){
		return this.http.get('https://api.ipify.org/?format=json');
	}

	setMessages(messages){
		this.messages = messages;
	}

	selectAllMessages(value: boolean){
		this.messages.forEach(message=>{
			message.selected = value;
		})
	}

	returnMessages(){
		return this.messages;
	}

	setMessagesUnread(messagesUnread: number){
		this.messagesUnread = messagesUnread;
	}
	
	getMessagesUnread(){
		return this.messagesUnread;
	}

	getGeoLocation(ip: string){
		return this.http.get(`https://api.ipgeolocation.io/ipgeo?apiKey=e7378bc6abe3425d8f0863b4a9e65398&ip=${ip}`);
	}

	saveLoginDetails(loginDetails: LoginDetails){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/saveLoginDetails',{loginDetails: loginDetails},{headers:headers,responseType:'text'});
	}

	getUsers(){
		return this.http.get(environment.apiUsersURL);
	}

	getUserDetails(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		//return this.http.post(environment.apiUsersURL+'/userprofile',{refreshToken: this.getRefreshToken()},{headers:headers});
		return this.http.get(environment.apiUsersURL+'/userprofile',{headers:headers});
	}

	markMessagesAsRead(messageIds: number[]){
		this.messages.forEach(message=>{
			if (messageIds.includes(message._id)){
				message.read = true;
			}
		})
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/markMessagesAsRead',{messageIds: messageIds,date: new Date()},{headers: headers});
	}

	deleteSelectedMessages(messageIds: number[]){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/deleteSelectedMessages',{messageIds: messageIds,date: new Date()},{headers: headers});
	}

	deleteGameHistory(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/deleteGameHistory',{headers:headers});
	}

	sendSubscriptionToTheServer(subscription: PushSubscription) {
		return this.http.post(environment.apiUsersURL+'/subscription', subscription)
	}

	sendPushNotifications(notification: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/sendPushNotifications',notification,{headers: headers});
	}

	newsletterUnsubscribe(token: string){
		return this.http.get(environment.apiUsersURL+'/newsletterUnsubscribe/'+token);
	}

	sendNewsletters(newsletter: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/sendNewsletters',newsletter,{headers: headers});
	}

	sendMessages(message: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/sendMessages',message,{headers: headers});
	}

	fetchMessages(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/messages',{headers: headers});
	}

	deleteMessages(messageIds){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/deleteMessages',{messageIds: messageIds},{headers: headers});
	}

	getMessages(){
		this.fetchMessages().subscribe(
			(res: any)=>{
				this.setMessages(res.messages.sort((a,b)=>(a.date<b.date?1:-1)));
				this.setMessagesUnread(res.messagesUnread);
			},
			(err)=>{
				this.setErrorMessage(err.error.message);
			})
	}

	updateUser(propertiesToUpdate: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/updateUser/'+this.getUser()._id,propertiesToUpdate,{headers: headers});
	}

	deleteProperties(propertiesToDelete: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/deleteProperties/'+this.getUser()._id,propertiesToDelete,{headers: headers});
	}

	updatePassword(token: string, password: string){
		return this.http.put(environment.apiUsersURL+'/updatePassword/'+token,password);
	}

	newPasswordRequest(email: String){
		return this.http.post(environment.apiUsersURL+'/forgotten',email);
	}

	downloadPersonalInformations(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/downloadPersonalInformations',{responseType: 'blob',headers:headers});
	}

	sendPersonalInformations(format: string){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/sendPersonalInformations',format,{headers: headers});
	}

	generateQRcode(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/generateQRcode',{headers:headers});
	}

	generateEmailSecret(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/generateEmailSecret',{headers:headers});
	}

	enableTwoFactor(code: string){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/enableTwoFactor',code,{headers:headers});
	}

	verifyTwoFactorCode(code: string){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getTempAccessToken()});
		return this.http.post(environment.apiUsersURL+'/verifyTwoFactorCode',code,{headers:headers});
	}

	sendTwoFactorEmail(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getTempAccessToken()});
		return this.http.get(environment.apiUsersURL+'/sendTwoFactorEmail',{headers: headers});
	}

	deleteProfile(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.delete(environment.apiUsersURL+'/deleteProfile',{headers: headers});
	}

	deleteAuthenticationCookies(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.delete(environment.apiUsersURL+'/deleteAuthenticationCookies',{headers: headers,withCredentials: true});
	}

	refreshAccessToken(){
		return this.http.get(environment.apiUsersURL+'/refreshAccessToken',{withCredentials: true});
	}

	setAccessToken(token: string){
		this.accessToken = token;
	}

	setTempAccessToken(token: string){
		this.tempAccessToken = token;
	}

	setLanguage(language: string){
		localStorage.setItem('lang',language);
	}

	getLanguage(){
		return localStorage.getItem('lang');
	}

	getAccessToken(){
		return this.accessToken;
	}

	getTempAccessToken(){
		return this.tempAccessToken;
	}

	resetAccessToken(){
		this.accessToken = null;
	}

	resetTempAccessToken(){
		this.tempAccessToken = null;
	}

	startSessionCountdown(){	
	    this.refreshTimeLeft();
	    this.sessionRefreshInterval = setInterval(()=>{
	        if (this.refreshTimeLeft()<=0){
	        	this.logoutUser('sessionIsOver');
	        }
	      },1000);
	}

	stopSessionCountdown(){
		clearInterval(this.sessionRefreshInterval);
	}

	resetSession(token: string){
		this.setAccessToken(token);
		this.stopSessionCountdown();
		this.startSessionCountdown();
	}

	logoutUser(msg: string){
		this.stopSessionCountdown();
		this.deleteAuthenticationCookies().subscribe(
			(res: any)=>{
				this.resetAccessToken();
				this.setSuccessMessage(msg);
				this.router.navigate(['/login']);
			},
			(err)=>{
				console.log(err);
			}
		);
	}

	refreshTimeLeft(){
		const payload = this.getAccessTokenPayload();
		if (payload) {
			this.timeLeftInMilisecs = JSON.parse(atob(payload)).exp*1000-Date.now();
			this.timeLeftAsString = this.getTimeLeftAsString();
			return this.timeLeftInMilisecs;
		} else {
			return false;
		}
	}

	getTimeLeftAsString(){
		let seconds = Math.floor(this.timeLeftInMilisecs/1000);
		let minutes = Math.floor(seconds/60);
		let secondsString = seconds%60<10?'0'+seconds%60:seconds%60;
		let minutesString = minutes<10?'0'+minutes:minutes;
		return minutesString+':'+secondsString;
	}

	getAccessTokenPayload(){
		const token = this.getAccessToken();
		if (token){
			return token.split('.')[1];
		} else {
			return null;
		}
	}

	isAuthenticated(){
		const payload = this.getAccessTokenPayload();
		if (payload){
			if (JSON.parse(atob(payload)).exp>Date.now()/1000){
				return true;
			} else {
				this.resetAccessToken();
				return false;
			}
		} else {
			return false;
		}
	}

	//jogosult-e a jelszó visszaállításra
	isAuthorizedToPasswordReset(){
		return this.authorizedToPasswordReset;
	}

	setAuthorizedToPasswordReset(value: boolean){
		this.authorizedToPasswordReset = value;
	}

	isResetTokenValid(token: String){
		return this.http.get(environment.apiUsersURL+'/isResetTokenValid/'+token);
	}

	setErrorMessage(msg: string){
		this.successMessage = null;
		this.errorMessage = msg;
		setTimeout(()=>{
			this.errorMessage = null;
		},3000);
	}

	setSuccessMessage(msg: string){
		this.errorMessage = null;
		this.successMessage = msg;
		setTimeout(()=>{
			this.successMessage = null;
		},3000);
	}

	getErrorMessage(){
		return this.errorMessage;
	}

	getSuccessMessage(){
		return this.successMessage;
	}

	getFirstName(){
		return this.user.first_name;
	}

	getLastName(){
		return this.user.last_name;
	}

	getRole(){
		return this.user.role;
	}

	isAdmin(){
		if (this.isAuthenticated() && this.user) {
			return this.user.role==='admin';
		} else return false;
	}

	getEmail(){
		return this.user.email;
	}

	getPassword(){
		return this.user.password;
	}

	setUser(user: User){
		this.user = user;
	}

	getUser(){
		return this.user;
	}

	getConsentToNewsletter(){
		return this.user.consentToNewsletter;
	}

	getTimeLeftInMilisecs(){
		return this.timeLeftInMilisecs;
	}

	getMaxIdleInMilisecs(){
		return this.maxIdleInMilisecs;
	}

	addToGameHistory(gameId: String){
		var headers = new HttpHeaders({'authorization':'Bearer ' + this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/addToGameHistory',{gameId: gameId},{headers: headers})
	}

	getWaitlist(){
		var headers = new HttpHeaders({'authorization':'Bearer ' + this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/getWaitlist',{headers: headers});
	}

	isGameOnWaitlist(gameID: String){
		var headers = new HttpHeaders({'authorization':'Bearer ' + this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/isGameOnWaitlist/'+gameID,{headers:headers});
	}

	addToWaitlist(game: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/addToWaitlist',game,{headers: headers});
	}

	editWaitlistItem(waitlistID: String,game: any){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.put(environment.apiUsersURL+'/editWaitlistItem/'+waitlistID,game,{headers: headers});
	}

	deleteWaitlistItem(waitlistID: String){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.delete(environment.apiUsersURL+'/deleteWaitlistItem/'+waitlistID,{headers: headers});
	}

	getGameHistory(){
		var headers = new HttpHeaders({'authorization':'Bearer ' + this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/getGameHistory',{headers: headers});
	}

	onSuccessfullLogin(res: any){
		this.setSuccessMessage(res.message);
		this.resetSession(res.accessToken);
		this.saveLoginDetails(this.loginDetails).subscribe(
			(res: any)=>{
				this.setUserDetails();
			},
			(err)=>{
				console.log(err);
			})
	}

	setUserDetails(){
		this.getUserDetails().subscribe(
			(res: any)=>{
				this.setUser(res.user);
				this.router.navigate(['/deals']);
			},
			(err)=>{
				this.setErrorMessage(err.error.message);
			});
	}

	getDeviceInfoThenLogin(loginFunction,form?){
		this.getIPAddress().subscribe(
			(res: any)=>{
				this.loginDetails = this.deviceDetectorService.getDeviceInfo();
				this.loginDetails.ip = res.ip;
				this.loginDetails.date = new Date();
				this.loginDetails.windowWidth = window.innerWidth;
				this.loginDetails.windowHeight = window.innerHeight;
				this.getGeoLocation(res.ip).subscribe(
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

	getLoginDetails(){
		return this.loginDetails;
	}
}
