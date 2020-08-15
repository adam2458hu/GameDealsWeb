import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserForgottenPasswordComponent } from './user-forgotten-password.component';

describe('UserForgottenPasswordComponent', () => {
  let component: UserForgottenPasswordComponent;
  let fixture: ComponentFixture<UserForgottenPasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserForgottenPasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserForgottenPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
