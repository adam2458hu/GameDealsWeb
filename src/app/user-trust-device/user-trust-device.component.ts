import { Component, OnInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-trust-device',
  templateUrl: './user-trust-device.component.html',
  styleUrls: ['./user-trust-device.component.scss']
})
export class UserTrustDeviceComponent implements OnInit {

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private userService: UserService
	) { }

	ngOnInit() {
		this.userService.trustDevice(this.route.snapshot.paramMap.get("token")).subscribe(
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
