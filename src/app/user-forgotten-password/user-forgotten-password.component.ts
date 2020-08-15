import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-forgotten-password',
  templateUrl: './user-forgotten-password.component.html',
  styleUrls: ['./user-forgotten-password.component.scss']
})
export class UserForgottenPasswordComponent implements OnInit {
  user = {
    email: ''
  }
  
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
	  this.userService.newPasswordRequest(form.value).subscribe(
	  	(res: any)=>{
        this.loadingScreenService.setAnimation(false);
	  		this.userService.setSuccessMessage(res.message);
        this.router.navigate(['/']);
	  	},
	  	(err)=>{
	  		this.userService.setErrorMessage(err.error.message);
	  	}
	  );
  }

}
