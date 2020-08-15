import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
	timer: number;
	constructor(private router: Router) { }

	ngOnInit() {
		this.timer = 5;
		let t = setInterval(()=>{
			this.timer = this.timer-1;
		},1000);

		setTimeout(()=>{
			this.router.navigate(['/']);
			clearInterval(t);
		},5000);
	}

}
