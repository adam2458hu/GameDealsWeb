import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '../shared/game/game';
import { UserService } from '../shared/user/user.service';
import { FilterService } from '../shared/filter/filter.service';
import { TranslateService } from '@ngx-translate/core';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-user-waitlist',
  templateUrl: './user-waitlist.component.html',
  styleUrls: ['./user-waitlist.component.scss']
})
export class UserWaitlistComponent implements OnInit {
	selectedGame=null;
	waitlist=[];
	waitlistOpened = false;

	constructor(
		private router: Router,
		private userService: UserService,
		private filterService: FilterService,
		private loadingScreenService: LoadingScreenService,
		private translateService: TranslateService
	) { }

	ngOnInit() {
		if (!this.userService.isAuthenticated()){
			this.router.navigate(['/login']);
		} else {
			this.getWaitlist();
		}
	}

	getWaitlist(){
		this.userService.getWaitlist().subscribe(
			(res: any)=>{
				this.waitlist = res.waitlist;
			},
			(err)=>{
				console.log(err);
			})
	}

	deleteWaitlistItem(waitlistID: String){
		if (confirm(this.translateService.instant('confirmDelete'))) {
			this.loadingScreenService.setAnimation(true);
			this.userService.deleteWaitlistItem(waitlistID).subscribe(
				(res: any)=>{
					this.loadingScreenService.setAnimation(false);
					this.waitlist = this.waitlist.filter(item=>item._id!=waitlistID);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		}
	}

	showAllStores(gameID){
		this.selectedGame = {_id: gameID};
	}

	onClose(){
		this.waitlistOpened = false;
		this.selectedGame = null;
		this.getWaitlist();
	}

}
