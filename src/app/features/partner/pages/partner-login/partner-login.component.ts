import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-partner-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './partner-login.component.html',
  styleUrls: ['./partner-login.component.scss']
})
export class PartnerLoginComponent {
  loginForm: FormGroup;
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = false;
  errorMessage: string = '';
  showPassword = false;

  constructor(private fb: FormBuilder) {
    console.log('Login component initialized'); // Add this
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    console.log('Form submitted'); // Add this
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .login({
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        role: 'partner'
      })
      .subscribe({
        next: (response) => {
          console.log('Login success:', response);
          this.router.navigate(['/partner/dashboard']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Login failed';
          this.isSubmitting = false;
        }
      });
  }
}
