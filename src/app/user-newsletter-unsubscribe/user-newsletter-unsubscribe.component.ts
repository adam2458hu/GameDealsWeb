import { Component, OnInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-newsletter-unsubscribe',
  templateUrl: './user-newsletter-unsubscribe.component.html',
  styleUrls: ['./user-newsletter-unsubscribe.component.scss']
})
export class UserNewsletterUnsubscribeComponent implements OnInit {

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private loadingScreenService: LoadingScreenService,
		private userService: UserService
	) { }

	ngOnInit() {
		this.userService.newsletterUnsubscribe(this.route.snapshot.paramMap.get("token")).subscribe(
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
