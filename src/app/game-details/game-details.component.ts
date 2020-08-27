import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Game } from '../game/game';
import { UserService } from '../shared/user/user.service';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss']
})
export class GameDetailsComponent implements OnInit {
	@Input() selectedGame;
	@Output() close = new EventEmitter();
	descriptionOpened: boolean;
	loadingImages=true;
	orderedStores=[];

	constructor(
		private userService: UserService,
		private gameService: GameService
	) { }

	ngOnInit() {
		console.log(this.selectedGame);
		this.descriptionOpened=false;
		this.orderStoresByDiscountedPrice(this.selectedGame);
	}

	addToGameHistory(gameId){
		this.userService.addToGameHistory(gameId).subscribe(
			(res: any)=>{
			},
			(err)=>{
				console.log(err);
			}
		);
	}

	/*orderStoresByDiscountedPrice(game){
		return game.stores.sort((a,b)=>a.specialPrice-b.specialPrice);
	}*/

	orderStoresByDiscountedPrice(game){
		this.gameService.getGame(game._id).subscribe(
			(res:any)=>{
				this.orderedStores = res.game.stores.sort((a,b)=><any>a.specialPrice-<any>b.specialPrice);
			},
			(err)=>{
				console.log(err);
			})
	}

	onClose() {
		this.close.emit();
		this.selectedGame = null;
		this.descriptionOpened = false;
	}
}
