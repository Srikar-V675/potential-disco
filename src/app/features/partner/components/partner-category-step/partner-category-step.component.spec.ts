import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerCategoryStepComponent } from './partner-category-step.component';

describe('PartnerCategoryStepComponent', () => {
  let component: PartnerCategoryStepComponent;
  let fixture: ComponentFixture<PartnerCategoryStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerCategoryStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerCategoryStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
