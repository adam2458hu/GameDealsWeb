export class Slide {
	_id?: String;
	title : String;
	discountPercent : Number;
	link : String;
	endOfOffer : Date;
	image : String;

	constructor(anotherSlideObject?){
		if (anotherSlideObject){
			this._id=anotherSlideObject._id;
			this.title = anotherSlideObject.title;
			this.discountPercent = anotherSlideObject.discountPercent;
			this.link = anotherSlideObject.link;
			this.endOfOffer = anotherSlideObject.endOfOffer;
			this.image = anotherSlideObject.image;
		}
	}
}
