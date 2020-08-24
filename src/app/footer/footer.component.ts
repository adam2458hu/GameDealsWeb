import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  lang: String;
  
  constructor() { }

  ngOnInit() {
    this.lang = localStorage.getItem('lang') || 'en';
  }

  changeLang(lang){
    localStorage.setItem('lang',lang);
    window.location.reload();
    console.log(lang);
  }

}
