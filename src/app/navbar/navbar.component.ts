import { Component, HostListener, OnInit } from '@angular/core';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  private mobile: boolean;
  private resizeTimeout: any;

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
