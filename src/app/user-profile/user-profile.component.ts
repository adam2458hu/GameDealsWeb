import { Component, OnInit } from '@angular/core';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

	constructor(
		private userService: UserService
	) { }

	ngOnInit() {

	}

	onActivate(event) {
		window.scroll(0,0);
    	if (this.userService.isAuthenticated()){
    		this.userService.refreshAccessToken().subscribe(
    			(res: any)=>{
    				this.userService.resetSession(res.accessToken);
    			},
    			(err)=>{
    				console.log(err);
    			})
    	}
	}

}
