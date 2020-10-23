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
}
