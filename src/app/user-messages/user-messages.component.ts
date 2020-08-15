import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-user-messages',
  templateUrl: './user-messages.component.html',
  styleUrls: ['./user-messages.component.scss']
})
export class UserMessagesComponent implements OnInit {
	isAllSelected: boolean=false;

	constructor(
		private userService: UserService,
		private router: Router
	) { }

	ngOnInit() {
		if (!this.userService.isAuthenticated()){
			this.router.navigate(['/login']);
		}
	}

	selectAllMessages(){
		this.isAllSelected=!this.isAllSelected;
		this.userService.selectAllMessages(this.isAllSelected);
	}

	deleteSelectedMessages(){
		let selectedMessages=[];
		this.userService.returnMessages().forEach(message=>{
			if (message.selected){
				selectedMessages.push(message._id);
			}
		})
		if (selectedMessages.length>0){
			this.userService.deleteSelectedMessages(selectedMessages).subscribe(
			(res: any)=>{
				this.userService.getMessages();
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			})
		}
	}

	markSelectedMessagesAsRead(){
		let selectedMessages=[];
		this.userService.returnMessages().forEach(message=>{
			if (message.selected){
				selectedMessages.push(message._id);
			}
		})
		if (selectedMessages.length>0){
			this.markMessagesAsRead(selectedMessages);
		}
		console.log(selectedMessages);
	}

	markMessagesAsRead(messageIds: number[]){
		this.userService.markMessagesAsRead(messageIds).subscribe(
			(res: any)=>{
				//this.userService.getMessages();
				this.userService.setMessagesUnread(this.userService.getMessagesUnread()-messageIds.length);
			},
			(err)=>{
				this.userService.setErrorMessage(err.error.message);
			})
	}

}
