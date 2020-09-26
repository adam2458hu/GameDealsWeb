import { Component, OnInit} from '@angular/core';
import { CookieService } from '../shared/cookie/cookie.service';
import { LanguageService } from '../shared/language/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  lang: String;

  constructor(
    private cookieService: CookieService,
    private translateService: TranslateService,
    private languageService: LanguageService
  ) { }

  ngOnInit() {
    //this.lang = localStorage.getItem('lang') || 'en';
    this.lang = this.languageService.getLanguage();
  }

  changeLang(lang){
    /*localStorage.setItem('lang',lang);
    window.location.reload();*/
    this.languageService.setLanguage(lang);
    this.cookieService.setLanguageCookie(lang);
    this.translateService.use(lang);
  }

}
