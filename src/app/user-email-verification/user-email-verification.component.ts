import { Component, OnInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-email-verification',
  templateUrl: './user-email-verification.component.html',
  styleUrls: ['./user-email-verification.component.scss']
})
export class UserEmailVerificationComponent implements OnInit {

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService
	) { }

	ngOnInit() {
		this.userService.verifyEmail(this.route.snapshot.paramMap.get("token")).subscribe(
			(res: any)=>{
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.router.navigate(['/']);
				this.userService.setErrorMessage(err.error.message);
			}
		);
	}

}
