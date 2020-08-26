import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss']
})
export class BackToTopComponent implements OnInit {
	distanceFromTop;

	@HostListener('window:scroll',['$event'])
	onScroll(event){
		this.distanceFromTop = window.pageYOffset;
	}

	constructor() { }

	ngOnInit() {
	}

	scrollToTop(){
		/*
		//animated - 1 mp alatt ér a tetejére, század mp-enként lép az oldal
		//tetejétől lévő távolság század részével felfelé.
		let beginningDistance = window.pageYOffset;
		let scrollToTop = window.setInterval(() => {
		    let pos = window.pageYOffset;
		    if (pos > 0) {
		        window.scrollTo(0, pos - (beginningDistance/100)); // how far to scroll on each step
		    } else {
		        window.clearInterval(scrollToTop);
		    }
		}, 10);*/
		window.scroll(0,0);
	}

}
