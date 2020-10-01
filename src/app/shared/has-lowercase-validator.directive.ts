import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
	selector: '[appHasLowercaseValidator]',
	providers: [{
		provide: NG_VALIDATORS,
		useExisting: HasLowercaseValidatorDirective,
		multi: true
	}]
})

export class HasLowercaseValidatorDirective implements Validator{
	@Input() appHasLowercaseValidator: string;
	validate(control: AbstractControl): { [key:string]:any } | null {
		//const controlToCompare = control.parent.get(this.appEqualPasswordValidator);
		if (control.value && control.value.toUpperCase()==control.value) {
			return { 'needsLowercase' : true };
		}

		return null;
	}
}