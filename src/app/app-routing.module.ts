import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { CookiePolicyComponent } from './cookie-policy/cookie-policy.component';
import { HomeComponent } from './home/home.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserEmailVerificationComponent } from './user-email-verification/user-email-verification.component';
import { UserForgottenPasswordComponent } from './user-forgotten-password/user-forgotten-password.component';
import { UserNewsletterUnsubscribeComponent } from './user-newsletter-unsubscribe/user-newsletter-unsubscribe.component';
import { UserNewPasswordComponent } from './user-new-password/user-new-password.component';
import { UserSecurityComponent } from './user-security/user-security.component';
import { UserAdminComponent } from './user-admin/user-admin.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserWaitlistComponent } from './user-waitlist/user-waitlist.component';
import { UserDataRequestComponent } from './user-data-request/user-data-request.component';
import { UserMessagesComponent } from './user-messages/user-messages.component';
import { UserTrustDeviceComponent } from './user-trust-device/user-trust-device.component';
import { DealsComponent } from './deals/deals.component';
import { ArticleComponent } from './article/article.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
	{
		path: 'home',component: HomeComponent, data: {title: 'pageTitle'}
	},
	{
		path: 'register',component: UserRegisterComponent, data: {title: 'pageTitleRegister'}
	},
	{
		path: 'login',component: UserLoginComponent, data: {title: 'pageTitleLogin'}
	},
	{
		path: 'profile',
		redirectTo:'profile/details'
	},
	{
		path: 'profile',
		component: UserProfileComponent,
		children: [
			{
				path: 'details',component: UserDetailsComponent, data: {title: 'pageTitleDetails'}
			},
			{
				path: 'security',component: UserSecurityComponent, data: {title: 'pageTitleSecurity'}
			},
			{
				path: 'waitlist',component: UserWaitlistComponent, data: {title: 'pageTitleWaitlist'}
			},
			{
				path: 'admin',component: UserAdminComponent, data: {title: 'pageTitleAdmin'}
			},
		]
	},
	{
		path: 'articles/:slug',component: ArticleComponent
	},
	{
		path: 'deals',component: DealsComponent, data: {title: 'pageTitleDeals'}
	},
	{
		path: 'messages',component: UserMessagesComponent, data: {title: 'pageTitleMessages'}
	},
	{
		path: 'email-verification/:token',component: UserEmailVerificationComponent, data: {title: 'pageTitleEmailVerification'}
	},
	{
		path: 'data-request/:token',component: UserDataRequestComponent, data: {title: 'pageTitleDataRequest'}
	},
	{
		path: 'forgot-password',component: UserForgottenPasswordComponent, data: {title: 'pageTitleForgottenPassword'}
	},
	{
		path: 'newsletter-unsubscribe/:token',component: UserNewsletterUnsubscribeComponent,data: {title: 'pageTitleNewsletterUnsubscribe'}
	},
	{
		path: 'trust-device/:token',component: UserTrustDeviceComponent, data: {title: 'pageTitleTrustDevice'}
	},
	{
		path: 'new-password/:token',component: UserNewPasswordComponent, data: {title: 'pageTitleNewPassword'}
	},
	{
		path: 'privacy-policy',component: PrivacyPolicyComponent, data: {title: 'pageTitlePrivacyPolicy'}
	},
	{
		path: 'cookie-policy',component: CookiePolicyComponent, data: {title: 'pageTitleCookiePolicy'}
	},
	{
		path: '',redirectTo:'/home',pathMatch: 'full'
	},
	{
		path: '404',component: NotFoundComponent, data: {title: 'pageTitle404'}
	},
	{
		path: '**',redirectTo:'/404'
	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
