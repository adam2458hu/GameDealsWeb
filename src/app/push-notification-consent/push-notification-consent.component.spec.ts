import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PushNotificationConsentComponent } from './push-notification-consent.component';

describe('PushNotificationConsentComponent', () => {
  let component: PushNotificationConsentComponent;
  let fixture: ComponentFixture<PushNotificationConsentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PushNotificationConsentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PushNotificationConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
