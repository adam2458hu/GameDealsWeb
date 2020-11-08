export class Consent {
	necessary: boolean;
	functional: boolean;
	analytical: boolean;
	advertising: boolean;
	
	constructor(necessary,functional,analytical,advertising){
		this.necessary = necessary;
		this.functional = functional;
		this.analytical = analytical;
		this.advertising = advertising;
	}
}
