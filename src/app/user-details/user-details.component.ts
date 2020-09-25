import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../shared/user/user.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
	/*user = {
		_id: '',
		first_name:'',
		last_name:'',
		email:'',
		consentToNewsletter: false,
		twoFactor:false
	}*/
	popupOpened: boolean=false;
	propertiesToUpdate = {};
	format: string = 'pdf';
	pushNotificationText: String='';
	pushNotificationTitle: String='';

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
			this.getUserProfile();
		}
	}

	getUserService(){
		return this.userService;
	}

	onSubmit(form: NgForm){
		this.propertiesToUpdate = {
			first_name: form.value.first_name,
			last_name: form.value.last_name,
			email: form.value.email,
			consentToNewsletter: form.value.consentToNewsletter,
			language: form.value.language
		}

		this.loadingScreenService.setAnimation(true);
		this.userService.updateUser(this.propertiesToUpdate).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	downloadPersonalInformations(type: string){
		if (type=='pdf'){
			var doc = new jsPDF();
			doc.autoTable({
				body : [
					[
						'Azonosító',this.userService.getUser()._id],[
						'Jogosultság',this.userService.getUser().role],[
						'Vezetéknév',this.userService.getUser().last_name],[
						'Keresztnév',this.userService.getUser().first_name],[
						'Jelszó',this.userService.getUser().password],[
						'Email',this.userService.getUser().email],[
						'Hozzájárult a GPDR-hoz',this.userService.getUser().consentToGDPR],[
						'Hozzájárult a hírlevél küldéshez',this.userService.getUser().consentToNewsletter],[
						'Alkalmazás hitelesítés engedélyezve',this.userService.getUser().twoFactorGoogleEnabled],[
						'Email hitelesítés engedélyezve',this.userService.getUser().twoFactorEmailEnabled],[
						'Utolsó jelszó módosítás dátuma',this.userService.getUser().lastPasswordChange],[
						'Profil létrehozva',this.userService.getUser().createdAt],[
						'Profil frissítve',this.userService.getUser().updatedAt],[
						'Email token',this.userService.getUser().twoFactorEmailSecret],[
						'Alkalmazás token',this.userService.getUser().twoFactorGoogleSecret],[
						'IP cím',this.userService.getUser().lastLoginDetails.ip],[
						'Dátum',this.userService.getUser().lastLoginDetails.date],[
						'Felhasználói ágens',this.userService.getUser().lastLoginDetails.userAgent],[
						'Eszköz',this.userService.getUser().lastLoginDetails.device],[
						'Operációs rendszer,',this.userService.getUser().lastLoginDetails.os],[
						'Operációs rendzser verziószáma',this.userService.getUser().lastLoginDetails.os_version],[
						'Böngészö',this.userService.getUser().lastLoginDetails.browser],[
						'Böngészö verziószáma',this.userService.getUser().lastLoginDetails.browser_version],[
						'Böngészö ablak szélessége',this.userService.getUser().lastLoginDetails.windowWidth + ' pixel'],[
						'Böngészö ablak magassága',this.userService.getUser().lastLoginDetails.windowHeight + ' pixel'],[
						'Üzenetek',this.userService.getUser().messages
					]
				]
			})
			doc.save(`${this.userService.getUser().last_name} ${this.userService.getUser().first_name}_${this.userService.getUser()._id}.pdf`
				);
		} else if (type=='json'){
			this.loadingScreenService.setAnimation(true);
			this.userService.downloadPersonalInformations().subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				const blob = new Blob([res],{type : 'application/json'});
				let downloadURL = window.URL.createObjectURL(blob);
				var link = document.createElement('a');
				link.href = downloadURL;
				link.download = `${this.userService.getUser().last_name} ${this.userService.getUser().first_name}_${this.userService.getUser()._id}.json`;
				link.click();
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
		}
	}

	sendPersonalInformations(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.sendPersonalInformations(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			})
	}

	getUserProfile(){
		this.userService.getUserProfile().subscribe(
			(res: any)=>{
				this.userService.setUser(res.user);
				//this.userService.resetSession(res.accessToken);
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			});
	}

	deleteProfile(){
		this.loadingScreenService.setAnimation(true);
		this.userService.deleteProfile(this.userService.getUser()._id).subscribe(
			(res: any)=>{
				this.setPopup(false);
				this.loadingScreenService.setAnimation(false);
				this.userService.logoutUser(res.message);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
			});
	}

	setPopup(value: boolean){
		this.popupOpened = value;
	}

	isPopupOpened(){
		return this.popupOpened;
	}

}
