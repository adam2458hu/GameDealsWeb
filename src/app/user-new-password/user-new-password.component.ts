import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router,ActivatedRoute } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-new-password',
  templateUrl: './user-new-password.component.html',
  styleUrls: ['./user-new-password.component.scss']
})
export class UserNewPasswordComponent implements OnInit {
	user = {
		password: '',
		confirmPassword: ''
	}

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService
	) { }

	ngOnInit() {
		this.userService.isResetTokenValid(this.route.snapshot.paramMap.get("token")).subscribe(
			(res: any)=>{
			  if (res.authorized===true){
			    this.userService.setAuthorizedToPasswordReset(true);
			  } else {
			  	this.router.navigate(['/']);
			  }
			},
			(err)=>{
				this.router.navigate(['/']);
				this.userService.setErrorMessage(err.error.message);
			}
		);
	}

	onSubmit(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		if (this.userService.isAuthorizedToPasswordReset()){
			this.userService.updatePassword(this.route.snapshot.paramMap.get("token"),form.value).subscribe(
				(res: any)=>{
					if (res.updated===true){
						this.loadingScreenService.setAnimation(false);
						this.userService.setSuccessMessage('A jelszó sikeresen frissítve');
						this.userService.setAuthorizedToPasswordReset(false);
						this.router.navigate(['/']);
					}
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
					this.userService.setAuthorizedToPasswordReset(false);
					this.router.navigate(['/']);
				}
			)
		}
	}

}
