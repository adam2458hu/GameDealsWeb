import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from './user';
import { LoginDetails } from '../login-details/login-details';

@Injectable({
  providedIn: 'root'
})
export class UserService {
	private errorMessage: String;
	private successMessage: String;
	private maxIdleInMilisecs: number=60000;
	private timeLeftInMilisecs: number;
	private timeLeftAsString: String;
	//private timePassedPercentage: number;
	private sessionRefreshInterval: number;
	private authorizedToPasswordReset: boolean;
	private messages;
	private messagesUnread;
	private user: User={
		role: '',
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		rememberMe: false,
		twoFactorGoogleEnabled: false,
		twoFactorEmailEnabled: false,
		consentToNewsletter: false,
		consentToGDPR: false,
		lastPasswordChange: '',
		twoFactorEmailSecret: '',
		twoFactorGoogleSecret: '',
		lastLoginDetails : {
			ip : '',
			date : new Date('2020-05-31T12:30:36.658+00:00'),
			userAgent:  '',
			os: '',
			browser: '',
			device: '',
			os_version: '',
			browser_version: '',
			windowWidth: '',
			windowHeight: ''
		},
		createdAt: '',
		updatedAt: '',
		messages: {
			date: new Date('2020-05-31T12:30:36.658+00:00'),
			type: '',
			title: '',
			text: '',
			read : false
		}
	};

	constructor(private http: HttpClient,private router: Router) { }

	registerUser(user: User){
		return this.http.post(environment.apiUsersURL+'/register',user);
	}

	verifyEmail(token: string){
		return this.http.get(environment.apiUsersURL+'/verifyEmail/'+token);
	}

	verifyDataRequest(token: string){
		return this.http.get(environment.apiUsersURL+'/verifyDataRequest/'+token);
	}

	resendVerificationLink(email: String){
		return this.http.post(environment.apiUsersURL+'/resendVerificationLink',{email: email});
	}

	loginUser(user: User){
		return this.http.post(environment.apiUsersURL+'/login',user);
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

	getUserProfile(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/userprofile',{refreshToken: this.getRefreshToken()},{headers:headers});
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
		return this.http.post(environment.apiUsersURL+'/sendPushNotifications',notification);
	}

	sendNewsletters(newsletter: any){
		return this.http.post(environment.apiUsersURL+'/sendNewsletters',newsletter);
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
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getTempToken()});
		return this.http.post(environment.apiUsersURL+'/verifyTwoFactorCode',code,{headers:headers});
	}

	sendTwoFactorEmail(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getTempToken()});
		console.log("elküldve");
		return this.http.get(environment.apiUsersURL+'/sendTwoFactorEmail',{headers: headers});
	}

	deleteProfile(id: String){
		return this.http.delete(environment.apiUsersURL+'/'+id);
	}

	refreshAccessToken(){
		var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.post(environment.apiUsersURL+'/refreshAccessToken',{refreshToken: this.getRefreshToken()},{headers:headers});
	}

	setAccessToken(token: string){
		localStorage.setItem('accessToken',token);
	}

	setTempToken(token: string){
		localStorage.setItem('tempToken',token);
	}

	setRefreshToken(token: string){
		localStorage.setItem('refreshToken',token);
	}

	getAccessToken(){
		return localStorage.getItem('accessToken');
	}

	getTempToken(){
		return localStorage.getItem('tempToken');
	}

	getRefreshToken(){
		return localStorage.getItem('refreshToken');
	}

	removeAccessToken(){
		localStorage.removeItem('accessToken');
	}

	removeTempToken(){
		localStorage.removeItem('tempToken');
	}

	removeRefreshToken(){
		localStorage.removeItem('refreshToken');
		/*var headers = new HttpHeaders({'authorization':'Bearer '+this.getAccessToken()});
		return this.http.delete(environment.apiUsersURL+'/logout',{token: this.getRefreshToken()},{headers:headers});
	*/}

	startSessionCountdown(){	
	    this.refreshTimeLeft();
	    this.sessionRefreshInterval = setInterval(()=>{
	        if (this.refreshTimeLeft()<=0){
	        	this.logoutUser('A munkamenet lejárt, jelentkezzen be újra');
	        }
	      },1000);
	}

	stopSessionCountdown(){
		clearInterval(this.sessionRefreshInterval);
	}

	resetSession(token: string){
		this.removeAccessToken();
		this.setAccessToken(token);
		this.stopSessionCountdown();
		this.startSessionCountdown();
	}

	logoutUser(msg: String){
		if (localStorage.getItem('rememberMe')){
			localStorage.removeItem('email');
			localStorage.removeItem('password');
			localStorage.removeItem('rememberMe');
		}
		
		this.removeAccessToken();
		this.removeRefreshToken();
		this.stopSessionCountdown();
		this.setSuccessMessage(msg);
		this.router.navigate(['/login']);
	}

	refreshTimeLeft(){
		const payload = this.getPayload();
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

	getPayload(){
		const token = this.getAccessToken();
		if (token){
			return token.split('.')[1];
		} else {
			return null;
		}
	}

	isAuthenticated(){
		const payload = this.getPayload();
		if (payload){
			if (JSON.parse(atob(payload)).exp>Date.now()/1000){
				return true;
			} else {
				this.removeAccessToken();
				this.removeRefreshToken();
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
		return this.http.get(environment.apiUsersURL+'/forgotten/'+token);
	}

	setErrorMessage(msg: String){
		this.successMessage = null;
		this.errorMessage = msg;
		setTimeout(()=>{
			this.errorMessage = null;
		},3000);
	}

	setSuccessMessage(msg: String){
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
		return this.user.role==='admin';
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

	getGameHistory(){
		var headers = new HttpHeaders({'authorization':'Bearer ' + this.getAccessToken()});
		return this.http.get(environment.apiUsersURL+'/getGameHistory',{headers: headers});
	}
}
