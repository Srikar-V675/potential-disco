import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerBasicInfoStepComponent } from './partner-basic-info-step.component';

describe('PartnerBasicInfoStepComponent', () => {
  let component: PartnerBasicInfoStepComponent;
  let fixture: ComponentFixture<PartnerBasicInfoStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerBasicInfoStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerBasicInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
