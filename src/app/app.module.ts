import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader} from '@ngx-translate/http-loader';
import { QuillModule } from 'ngx-quill';
import 'hammerjs';

import { AppComponent } from './app.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { NavbarComponent } from './navbar/navbar.component';
import { BackToTopComponent } from './back-to-top/back-to-top.component';
import { DealsComponent } from './deals/deals.component';
import { FooterComponent } from './footer/footer.component';
import { FilterComponent } from './filter/filter.component';
import { ModalComponent } from './modal/modal.component';
import { UserForgottenPasswordComponent } from './user-forgotten-password/user-forgotten-password.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { UserNewPasswordComponent } from './user-new-password/user-new-password.component';
import { HasNumberValidatorDirective } from './shared/has-number-validator.directive';
import { HasLowercaseValidatorDirective } from './shared/has-lowercase-validator.directive';
import { HasUppercaseValidatorDirective } from './shared/has-uppercase-validator.directive';
import { EqualPasswordValidatorDirective } from './shared/equal-password-validator.directive';
import { MainComponent } from './main/main.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { UserSecurityComponent } from './user-security/user-security.component';
import { UserEmailVerificationComponent } from './user-email-verification/user-email-verification.component';
import { CookieConsentComponent } from './cookie-consent/cookie-consent.component';
import { CookiePolicyComponent } from './cookie-policy/cookie-policy.component';
import { environment } from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { UserAdminComponent } from './user-admin/user-admin.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserMessagesComponent } from './user-messages/user-messages.component';
import { UserDataRequestComponent } from './user-data-request/user-data-request.component';
import { HomeComponent } from './home/home.component';
import { ChartComponent } from './chart/chart.component';
import { GameDetailsComponent } from './game-details/game-details.component';

import { LoadedDirective } from './loaded.directive';
import { WaitlistComponent } from './waitlist/waitlist.component';
import { UserNewsletterUnsubscribeComponent } from './user-newsletter-unsubscribe/user-newsletter-unsubscribe.component';
import { UserTrustDeviceComponent } from './user-trust-device/user-trust-device.component';
import { UserWaitlistComponent } from './user-waitlist/user-waitlist.component';
import { ArticleComponent } from './article/article.component';
import { ArticleCreatorComponent } from './article-creator/article-creator.component';
import { PushNotificationConsentComponent } from './push-notification-consent/push-notification-consent.component';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

export class MyHammerConfig extends HammerGestureConfig {
    overrides = <any> {
        'pinch': { enable: false },
        'rotate': { enable: false }
    }
}

@NgModule({
  declarations: [
    AppComponent,
    UserProfileComponent,
    UserLoginComponent,
    UserRegisterComponent,
    NavbarComponent,
    BackToTopComponent,
    DealsComponent,
    FooterComponent,
    FilterComponent,
    ModalComponent,
    UserForgottenPasswordComponent,
    NotFoundComponent,
    UserNewPasswordComponent,
    HasNumberValidatorDirective,
    HasLowercaseValidatorDirective,
    HasUppercaseValidatorDirective,
    EqualPasswordValidatorDirective,
    MainComponent,
    PrivacyPolicyComponent,
    UserSecurityComponent,
    UserEmailVerificationComponent,
    CookieConsentComponent,
    CookiePolicyComponent,
    UserAdminComponent,
    UserDetailsComponent,
    UserMessagesComponent,
    UserDataRequestComponent,
    HomeComponent,
    ChartComponent,
    GameDetailsComponent,
    LoadedDirective,
    WaitlistComponent,
    UserNewsletterUnsubscribeComponent,
    UserTrustDeviceComponent,
    UserWaitlistComponent,
    ArticleComponent,
    ArticleCreatorComponent,
    PushNotificationConsentComponent
  ], 
  imports: [
    BrowserModule,
    DeviceDetectorModule.forRoot(),
    AngularFontAwesomeModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    QuillModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
        }
    })
  ],
  providers: [
    HttpClient,
    {
        provide: HAMMER_GESTURE_CONFIG,
        useClass: MyHammerConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
