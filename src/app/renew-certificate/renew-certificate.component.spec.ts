import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewCertificateComponent } from './renew-certificate.component';

describe('RenewCertificateComponent', () => {
  let component: RenewCertificateComponent;
  let fixture: ComponentFixture<RenewCertificateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RenewCertificateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenewCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
