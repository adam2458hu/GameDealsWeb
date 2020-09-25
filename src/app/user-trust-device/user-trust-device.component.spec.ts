import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTrustDeviceComponent } from './user-trust-device.component';

describe('UserTrustDeviceComponent', () => {
  let component: UserTrustDeviceComponent;
  let fixture: ComponentFixture<UserTrustDeviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserTrustDeviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserTrustDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
