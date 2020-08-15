import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
	selector: '[appEqualPasswordValidator]',
	providers: [{
		provide: NG_VALIDATORS,
		useExisting: EqualPasswordValidatorDirective,
		multi: true
	}]
})

export class EqualPasswordValidatorDirective implements Validator{
	@Input() appEqualPasswordValidator: string;
	validate(control: AbstractControl): { [key:string]:any } | null {
		const controlToCompare = control.parent.get(this.appEqualPasswordValidator);
		if (controlToCompare && controlToCompare.value !== control.value) {
			return { 'notEqual' : true };
		}

		return null;
	}
}