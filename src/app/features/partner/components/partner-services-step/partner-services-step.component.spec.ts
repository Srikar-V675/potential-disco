import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerServicesStepComponent } from './partner-services-step.component';

describe('PartnerServicesStepComponent', () => {
  let component: PartnerServicesStepComponent;
  let fixture: ComponentFixture<PartnerServicesStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerServicesStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerServicesStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
