import { Component, Input, Output, OnInit,EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UserService } from '../shared/user/user.service';
import { StoreService } from '../shared/store/store.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-waitlist',
  templateUrl: './waitlist.component.html',
  styleUrls: ['./waitlist.component.scss']
})
export class WaitlistComponent implements OnInit {
	@Input() selectedGame;
	@Input() gameIsOnWaitlist;
	@Output() close = new EventEmitter();
	@Output() add = new EventEmitter();
	@Output() edit = new EventEmitter();
	@Output() delete = new EventEmitter();
	waitlist= {
		_id:'',
		gameID: '',
		name: '',
		maxPrice : 0,
		minDiscount : 0
	}
	gameDetailsReceived=false;
	stores: {name: String,isSelected: Boolean}[] = [];
	private selectedStores: String[]=[];

	constructor(
		private userService: UserService,
		private storeService: StoreService,
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		this.getStores();
		this.waitlist.gameID = this.selectedGame._id;
		this.waitlist.name = this.selectedGame.name;
		if (this.gameIsOnWaitlist){
			this.waitlist._id = this.gameIsOnWaitlist._id;
			this.waitlist.maxPrice = this.gameIsOnWaitlist.maxPrice;
			this.waitlist.minDiscount = this.gameIsOnWaitlist.minDiscount;
			this.stores.forEach(store=>{
				if (!this.gameIsOnWaitlist.selectedStores.includes(store.name)){
					store.isSelected = false;
				}
			})
		}
		this.gameDetailsReceived=true;
	}

	addToWaitlist(form: NgForm){
		this.loadingScreenService.setAnimation(true);
		this.stores.forEach(store=>{
			if (store.isSelected) this.selectedStores.push(store.name);
		})
		form.value.selectedStores = this.selectedStores;
		this.userService.addToWaitlist(form.value).subscribe(
		(res: any)=>{
			this.loadingScreenService.setAnimation(false);
			this.selectedStores=[];
			this.userService.setSuccessMessage(res.message);
			this.add.emit();
			this.close.emit();
		},
		(err)=>{
			this.loadingScreenService.setAnimation(false);
			this.selectedStores=[];
			this.userService.setErrorMessage(err.error.message);
		});
  	}

  	editWaitlistItem(waitlistID: String,form: NgForm){
  		this.loadingScreenService.setAnimation(true);
		this.stores.forEach(store=>{
			if (store.isSelected) this.selectedStores.push(store.name);
		})
		form.value.selectedStores = this.selectedStores;
  		this.userService.editWaitlistItem(waitlistID,form.value).subscribe(
		(res: any)=>{
			this.loadingScreenService.setAnimation(false);
			this.userService.setSuccessMessage(res.message);
			this.edit.emit();
			this.close.emit();
		},
		(err)=>{
			this.loadingScreenService.setAnimation(false);
			this.userService.setErrorMessage(err.error.message);
		});
  	}

  	deleteWaitlistItem(waitlistID: String){
  		this.userService.deleteWaitlistItem(waitlistID).subscribe(
		(res: any)=>{
			this.loadingScreenService.setAnimation(false);
			this.userService.setSuccessMessage(res.message);
			this.delete.emit();
			this.close.emit();
		},
		(err)=>{
			this.loadingScreenService.setAnimation(false);
			this.userService.setErrorMessage(err.error.message);
		});
  	}

  	getStores(){
		this.storeService.getStores().forEach(store=>{
			this.stores.push({
				name: store.name,
				isSelected : true
			});
		})
	}

	onClose(){
		this.close.emit();
	}
}
