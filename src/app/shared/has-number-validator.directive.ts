import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
	selector: '[appHasNumberValidator]',
	providers: [{
		provide: NG_VALIDATORS,
		useExisting: HasNumberValidatorDirective,
		multi: true
	}]
})

export class HasNumberValidatorDirective implements Validator{
	@Input() appHasNumberValidator: string;
	validate(control: AbstractControl): { [key:string]:any } | null {
		//const controlToCompare = control.parent.get(this.appEqualPasswordValidator);
		if (control.value && !/\d/.test(control.value)) {
			return { 'needsNumber' : true };
		}

		return null;
	}
}