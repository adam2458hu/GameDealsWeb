import { Component, OnInit } from '@angular/core';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

	constructor(private userService: UserService) { }

	ngOnInit() {
	}

	refreshAccessToken(){
		this.userService.refreshAccessToken().subscribe(
			(res: any)=>{
				if (res.accessToken){
					this.userService.resetSession(res.accessToken);
					//this.userService.setSuccessMessage('Munkamenet meghosszabbítva');
				}
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
		});
	}

	getUserService(){
		return this.userService;
	}

	getMaxIdleInMilisecs(){
		return this.userService.getMaxIdleInMilisecs();
	}

	getTimeLeftInMilisecs(){
		return this.userService.getTimeLeftInMilisecs();
	}

	getTimeLeftAsString(){
		return this.userService.getTimeLeftAsString();
	}
}
