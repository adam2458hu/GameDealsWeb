import { Component, AfterViewInit, EventEmitter, Input, Output,ViewChild, ElementRef } from '@angular/core';
import { DatePipe,DecimalPipe } from '@angular/common';
import { Game } from '../game/game';
import { UserService } from '../shared/user/user.service';
import { GameService } from '../game/game.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss']
})
export class GameDetailsComponent implements AfterViewInit {
	@Input() selectedGame;
	@Output() close = new EventEmitter();
	@ViewChild('gameDetailsDiv',{ static: false }) gameDetailsDiv: ElementRef;
	descriptionOpened: boolean;
	loading=true;
	loadingImages=true;
	orderedStores=[];
	gameDetails;
	gameDetailsReceived=false;
	waitlistOpened = false;
	gameIsOnWaitlist;

	constructor(
		private userService: UserService,
		private gameService: GameService,
		private loadingScreenService: LoadingScreenService
	) { }

	ngAfterViewInit() {
		this.descriptionOpened=false;
		this.getGameDetails(this.selectedGame._id);
	}

	addToGameHistory(gameID){
		this.userService.addToGameHistory(gameID).subscribe(
			(res: any)=>{
			},
			(err)=>{
				console.log(err);
			}
		);
	}

	openWaitlist(){
		this.waitlistOpened = !this.waitlistOpened;
	}

	isGameOnWaitlist(gameID){
		this.userService.isGameOnWaitlist(gameID).subscribe(
			(res: any)=>{
				this.gameIsOnWaitlist = res.isGameOnWaitlist;
				this.gameDetailsReceived = true;
				setTimeout(()=>{
					this.gameDetailsDiv.nativeElement.style.top = (window.pageYOffset+100)+"px";
				},10);
			},
			(err)=>{
				console.log(err);
			})
	}

	getGameDetails(gameID){
		this.gameService.getGame(gameID).subscribe(
			(res: any)=>{
				this.gameDetails=res.game;
				this.orderStoresByDiscountedPrice(this.gameDetails);
			},
			(err)=>{
				console.log(err);
			})
	}

	getUserService(){
	  	return this.userService;
	  }

	getStoreWithImage(){
		return this.gameDetails.stores.find(element=>element.image!=null);
	}

	orderStoresByDiscountedPrice(game){
		this.orderedStores = game.stores.sort((a,b)=><any>a.specialPrice-<any>b.specialPrice);
		if (this.userService.isAuthenticated()){
			this.isGameOnWaitlist(game._id);
		} else {
			this.gameDetailsReceived = true;
			setTimeout(()=>{
				this.gameDetailsDiv.nativeElement.style.top = (window.pageYOffset+100)+"px";
			},10);
		}
	}

	onClose() {
		this.gameDetails = null;
		this.selectedGame = null;
		this.descriptionOpened = false;
		this.close.emit();
	}
}
