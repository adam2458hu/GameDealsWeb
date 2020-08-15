export class Game {
	_id?: number;
	name: String;
	stores : [{
		originalPrice: String;
		specialPrice: String;
		discountPercent: String;
		linkToGame: String;
		image: String;
	}];
	metascore?: Number;
	description?: String;
	releaseDate?: Date;
	genres?: String[];
}
