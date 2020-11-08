export class Article {
	_id?: String;
	title : {
		lang: String,
		text: String
	}[];
	slug : String;
	lead : {
		lang: String,
		text: String
	}[];
	body : {
		lang: String,
		text: String
	}[];
	image : String;

	constructor(languages: String[]){
		this.title = [];
		this.lead = [];
		this.body = [];
		this.slug = '';
		this.image = '';

		languages.forEach(lang=>{
			this.title.push({
				lang: lang,
				text: ''
			});

			this.lead.push({
				lang: lang,
				text: ''
			});

			this.body.push({
				lang: lang,
				text: ''
			});
		})
	}
}
