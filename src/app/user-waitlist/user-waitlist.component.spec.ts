import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWaitlistComponent } from './user-waitlist.component';

describe('UserWaitlistComponent', () => {
  let component: UserWaitlistComponent;
  let fixture: ComponentFixture<UserWaitlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserWaitlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserWaitlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
