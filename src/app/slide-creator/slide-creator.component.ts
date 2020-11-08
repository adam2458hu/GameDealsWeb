import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Slide } from '../shared/slide/slide';
import { SlideService } from '../shared/slide/slide.service';
import { LanguageService } from '../shared/language/language.service';
import { LoadingScreenService } from '../shared/loading-screen/loading-screen.service';
import { UserService } from '../shared/user/user.service';

@Component({
  selector: 'app-slide-creator',
  templateUrl: './slide-creator.component.html',
  styleUrls: ['./slide-creator.component.scss']
})
export class SlideCreatorComponent implements OnInit {
  	@Input() editorOpened: boolean;
	@Output() createOrEdit = new EventEmitter();
	@Output() close = new EventEmitter();
	@Input() slideToEdit;
	slide: Slide;

	constructor(
		private slideService: SlideService,
		private loadingScreenService: LoadingScreenService,
		private languageService: LanguageService,
		private userService: UserService
	) { }

	ngOnInit() {
		if (this.slideToEdit) this.slide = new Slide(this.slideToEdit);
		else this.slide = new Slide();

		setTimeout(()=>{
			window.scrollTo(0,document.getElementById("editor").offsetTop-document.getElementById("navbar").scrollHeight);
		});
	}

	onClose(){
		this.close.emit();
	}

	onSubmit(form: NgForm){
		if (!this.slideToEdit) {
			this.loadingScreenService.setAnimation(true);
			this.slideService.createSlide(this.slide).subscribe(
				(res: any)=>{
					this.createOrEdit.emit();
					this.onClose();
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		} else {
			this.loadingScreenService.setAnimation(true);
			this.slideService.editSlide(this.slide).subscribe(
				(res: any)=>{
					this.createOrEdit.emit();
					this.onClose();
					this.loadingScreenService.setAnimation(false);
					this.userService.setSuccessMessage(res.message);
				},
				(err)=>{
					this.loadingScreenService.setAnimation(false);
					this.userService.setErrorMessage(err.error.message);
				})
		}
	}

}
