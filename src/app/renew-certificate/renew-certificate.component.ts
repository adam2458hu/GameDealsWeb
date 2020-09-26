import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-renew-certificate',
  templateUrl: './renew-certificate.component.html',
  styleUrls: ['./renew-certificate.component.scss']
})
export class RenewCertificateComponent implements OnInit {

  constructor(
  	private route: ActivatedRoute,
	private userService: UserService
  ) { }

  ngOnInit() {
  	this.userService.renewCertificate(this.route.snapshot.paramMap.get("fileName")).subscribe(
			(res: any)=>{
				console.log(res);
				this.userService.setSuccessMessage(res.message);
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			}
		);
  }

}
