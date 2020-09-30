import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
	selector: '[appHasUppercaseValidator]',
	providers: [{
		provide: NG_VALIDATORS,
		useExisting: HasUppercaseValidatorDirective,
		multi: true
	}]
})

export class HasUppercaseValidatorDirective implements Validator{
	@Input() appHasUppercaseValidator: string;
	validate(control: AbstractControl): { [key:string]:any } | null {
		//const controlToCompare = control.parent.get(this.appEqualPasswordValidator);
		if (control.value.toLowerCase()==control.value) {
			return { 'needsUppercase' : true };
		}

		return null;
	}
}