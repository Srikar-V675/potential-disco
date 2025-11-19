import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerRegistrationContainerComponent } from './partner-registration-container.component';

describe('PartnerRegistrationContainerComponent', () => {
  let component: PartnerRegistrationContainerComponent;
  let fixture: ComponentFixture<PartnerRegistrationContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerRegistrationContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerRegistrationContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
