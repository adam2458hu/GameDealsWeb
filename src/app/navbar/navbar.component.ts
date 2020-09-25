import { Component, HostListener, OnInit, ViewChild,ElementRef } from '@angular/core';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  private mobile: boolean;
  private resizeTimeout: any;
  @ViewChild('navbarToggler',{static:false}) navbarToggler: ElementRef;
  @ViewChild('responsiveNavbar',{static:false}) responsiveNavbar: ElementRef;
  @HostListener('window:resize')
  
  onWindowResize() {
      //debounce resize, wait for resize to finish before doing stuff
      if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout((() => {
        //if (window.screen.width <= 576) {
        if (window.screen.width <= 768) {
          this.mobile = true;
        } else {
          this.mobile = false;
        }
      }).bind(this), 500);
  };

  @HostListener('window:click',['$event'])
  onClick(event) {
    if (this.responsiveNavbar.nativeElement.classList.contains('show') && !event.target.classList.contains('navbar-toggler-icon')) {
      this.navbarToggler.nativeElement.click();
    }
  }

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.mobile = false;
    if (window.screen.width <= 576) {
      this.mobile = true;
    }
  }

  getUserService(){
  	return this.userService;
  }

  getTimeLeftAsString(){
    return this.userService.getTimeLeftAsString();
  }

  isAdmin(){
    return this.userService.isAdmin();
  }

  isMobile(){
    return this.mobile;
  }

}
