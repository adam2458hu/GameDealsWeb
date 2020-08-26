import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Game } from '../game/game';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss']
})
export class GameDetailsComponent implements OnInit {
	@Input() selectedGame: Game;
	@Output() close = new EventEmitter();
	descriptionOpened: boolean;
	loadingImages=true;

	constructor(
		private userService: UserService
	) { }

	ngOnInit() {
		this.descriptionOpened=false;
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

	orderStoresByDiscountedPrice(game){
		return game.stores.sort((a,b)=>a.specialPrice-b.specialPrice);
	}

	onClose() {
		this.close.emit();
		this.selectedGame = null;
		this.descriptionOpened = false;
	}
}
