import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../../core/services/auth.service';
import { FIELD_VALIDATORS, FORM_VALIDATORS, VALIDATION_MESSAGES } from '../../../../shared/constants/form-validators';
import * as AuthActions from '../../../../store/auth/auth.actions';

@Component({
  selector: 'app-user-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './user-signup.component.html',
  styleUrl: './user-signup.component.scss'
})
export class UserSignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);

  form!: FormGroup;
  agreeToTerms = false;
  showPassword = false;
  showConfirmPassword = false;
  validationMessages = VALIDATION_MESSAGES;

  ngOnInit() {
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
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    const messages = this.validationMessages[fieldName as keyof typeof VALIDATION_MESSAGES];

    for (const errorKey in errors) {
      if (messages && errorKey in messages) {
        return messages[errorKey as keyof typeof messages] as string;
      }
    }

    return '';
  }

  onSubmit() {
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.agreeToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    const formValue = this.form.value;
    const registerData = {
      userName: formValue.userName,
      email: formValue.email,
      phoneNumber: parseInt(formValue.phoneNumber),
      password: formValue.password,
      role: 'user' as const
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.store.dispatch(AuthActions.loginSuccess({
          user: response.user,
          token: response.token
        }));
        this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        alert(err.message || 'Registration failed. Please try again.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/user']);
  }
}
