export class User {
	_id?: String;
	role: String;
	first_name: String;
	last_name: String;
	email: String;
	password: String;
	language: String;
	rememberMe: Boolean;
	twoFactorGoogleEnabled: Boolean;
	twoFactorEmailEnabled: Boolean;
	consentToNewsletter: Boolean;
	consentToGDPR: Boolean;
	lastPasswordChange: String;
	twoFactorEmailSecret: String;
	twoFactorGoogleSecret: String;
	createdAt: String;
	updatedAt: String;
	lastLoginDetails : {
		ip : String;
		date : Date;
		userAgent:  String;
		os: String;
		browser: String;
		device: String;
		os_version: String;
		browser_version: String;
		windowWidth: String;
		windowHeight: String;
	};
	messages : {
		date : Date;
		type : String;
		title : String;
		text : String;
		read : Boolean;
	};
}
