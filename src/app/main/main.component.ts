import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

	constructor(
    private router: Router,
		private loadingScreenService: LoadingScreenService,
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

  getRouter(){
    return this.router;
  }

	isLoading(){
		return this.loadingScreenService.isLoading();
	}
}
