import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingScreenService {
	private loading: boolean = false;
	
	constructor() { }

	setAnimation(value: boolean){
		this.loading = value;
	}

	isLoading(){
		return this.loading;
	}
}
