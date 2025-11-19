import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../../core/services/auth.service';
import * as AuthActions from '../../../../store/auth/auth.actions';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);

  form!: FormGroup;
  showPassword = false;

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const { email, password } = this.form.value;

    this.authService.login({ email, password, role: 'user' }).subscribe({
      next: (response) => {
        this.store.dispatch(AuthActions.loginSuccess({
          user: response.user,
          token: response.token
        }));
        this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        alert(err.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/user']);
  }
}
