export class Filter {
	name?: String;
	minSpecialPrice: number;
	maxSpecialPrice: number;
	minOriginalPrice: number;
	maxOriginalPrice: number;
	minDiscountPercent?: number;
	maxDiscountPercent?: number;
	minTotalRating?: number;
	maxTotalRating?: number;
	selectedStores?: String[];
	gamesPerRequest: number;
	gameRequestOffset: number;
	direction: number;
	sortBy: String;
	currency: String;
	currencyPrevious: String;
	symbol: String;
	decimalPlaces: number;

	constructor(){
		this.name= null;
		this.minSpecialPrice= null;
		this.maxSpecialPrice= null;
		this.minOriginalPrice= null;
		this.maxOriginalPrice= null;
		this.minDiscountPercent= null;
		this.maxDiscountPercent= null;
		this.minTotalRating= null;
		this.maxTotalRating= null;
		this.gamesPerRequest= 10;
		this.gameRequestOffset= 0;
		this.selectedStores= [];
		this.direction= -1;
		this.sortBy= 'totalRating';
		this.currency= 'EUR';
		this.currencyPrevious= 'EUR';
		this.symbol= '€';
		this.decimalPlaces= 2;
	}

	reset(currency,currencyPrevious,symbol,decimalPlaces){
		this.name= null;
		this.minSpecialPrice= null;
		this.maxSpecialPrice= null;
		this.minOriginalPrice= null;
		this.maxOriginalPrice= null;
		this.minDiscountPercent= null;
		this.maxDiscountPercent= null;
		this.minTotalRating= null;
		this.maxTotalRating= null;
		this.selectedStores= [];
		this.gamesPerRequest= 10;
		this.gameRequestOffset= 0;
		this.direction= -1;
		this.sortBy= 'totalRating';
		this.currency= currency;
		this.currencyPrevious= currencyPrevious;
		this.symbol= symbol;
		this.decimalPlaces= decimalPlaces;
	}
}
