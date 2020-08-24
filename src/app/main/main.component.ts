import { Component, OnInit } from '@angular/core';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

	constructor(
		private loadingScreenService: LoadingScreenService
	) { }

	ngOnInit() {
		
	}

	onActivate(event) {
    	window.scroll(0,0);
	}

	isLoading(){
		return this.loadingScreenService.isLoading();
	}
}
