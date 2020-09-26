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
import { RenewCertificateComponent } from './renew-certificate/renew-certificate.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
	{
		path: 'home',component: HomeComponent
	},
	{
		path: 'register',component: UserRegisterComponent
	},
	{
		path: 'login',component: UserLoginComponent
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
				path: 'details',component: UserDetailsComponent
			},
			{
				path: 'security',component: UserSecurityComponent
			},
			{
				path: 'waitlist',component: UserWaitlistComponent
			},
			{
				path: 'admin',component: UserAdminComponent
			},
		]
	},
	{
		path: 'deals',component: DealsComponent
	},
	{
		path: 'messages',component: UserMessagesComponent
	},
	{
		path: 'email-verification/:token',component: UserEmailVerificationComponent
	},
	{
		path: 'data-request/:token',component: UserDataRequestComponent
	},
	{
		path: 'forgot-password',component: UserForgottenPasswordComponent
	},
	{
		path: 'newsletter-unsubscribe/:token',component: UserNewsletterUnsubscribeComponent
	},
	{
		path: 'trust-device/:token',component: UserTrustDeviceComponent
	},
	{
		path: 'new-password/:token',component: UserNewPasswordComponent
	},
	{
		path: 'privacy-policy',component: PrivacyPolicyComponent
	},
	{
		path: 'cookie-policy',component: CookiePolicyComponent
	},
	{
		path: '.well-known/pki-validation/:fileName', component: RenewCertificateComponent
	},
	{
		path: '',redirectTo:'/home',pathMatch: 'full'
	},
	{
		path: '404',component: NotFoundComponent
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
