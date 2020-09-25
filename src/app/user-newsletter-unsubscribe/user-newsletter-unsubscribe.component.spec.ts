import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserNewsletterUnsubscribeComponent } from './user-newsletter-unsubscribe.component';

describe('UserNewsletterUnsubscribeComponent', () => {
  let component: UserNewsletterUnsubscribeComponent;
  let fixture: ComponentFixture<UserNewsletterUnsubscribeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserNewsletterUnsubscribeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserNewsletterUnsubscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
