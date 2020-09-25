import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { User } from '../shared/user/user';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit {
	user = {
		first_name:'',
		last_name:'',
		email:'',
		password:'',
		confirmPassword:'',
		consentToGDPR: false,
		consentToNewsletter: false,
		language: localStorage.getItem('lang') || 'en'
	}

	emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	
	constructor(
		private router: Router,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService
	) { }

	ngOnInit() {
		if (this.userService.isAuthenticated()){
			this.router.navigate(['/deals']);
		}
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.userService.registerUser(form.value).subscribe(
			(res: any)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setSuccessMessage(res.message);
				this.router.navigate(['/']);
			},
			(err)=>{
				this.loadingScreenService.setAnimation(false);
				this.userService.setErrorMessage(err.error.message);
		});
	}

}
