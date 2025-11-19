import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PartnerRegistrationStore } from '../../../../store/partner-registration/partner-registration.store';
import {
  FIELD_VALIDATORS,
  FORM_VALIDATORS
} from '../../../../shared/constants/form-validators';

@Component({
  selector: 'app-partner-basic-info-step',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './partner-basic-info-step.component.html',
  styleUrls: ['./partner-basic-info-step.component.scss']
})
export class PartnerBasicInfoStepComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: PartnerRegistrationStore
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        userName: ['', FIELD_VALIDATORS.userName],
        email: ['', FIELD_VALIDATORS.email],
        phoneNumber: ['', FIELD_VALIDATORS.phoneNumber],
        password: ['', FIELD_VALIDATORS.password],
        confirmPassword: ['', FIELD_VALIDATORS.confirmPassword]
      },
      { validators: FORM_VALIDATORS.passwordMatch }
    );

    const initial = this.store.snapshot.basicInfo;
    if (initial) {
      this.form.patchValue(initial);
    }

    // Auto-save on changes
    this.form.valueChanges.subscribe((value) => {
      if (this.form.valid) {
        this.store.setBasicInfo(value);
      }
    });
  }
}
