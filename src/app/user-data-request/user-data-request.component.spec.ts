import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDataRequestComponent } from './user-data-request.component';

describe('UserDataRequestComponent', () => {
  let component: UserDataRequestComponent;
  let fixture: ComponentFixture<UserDataRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserDataRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDataRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
