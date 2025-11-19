// src/app/shared/components/header/header.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { User } from '../../../../core/models/user.model';
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../../store/auth/auth.selectors';
import * as AuthActions from '../../../../store/auth/auth.actions';

type HeaderType = 'partner' | 'customer';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private destroy$ = new Subject<void>();

  headerType: HeaderType = 'customer';
  isAuthenticated = false;
  currentUser: User | null = null;
  showProfileDropdown = false;

  ngOnInit(): void {
    // Determine header type from initial route
    this.updateHeaderType(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateHeaderType(event.urlAfterRedirects);
      });

    // Subscribe to auth state
    this.store
      .select(selectIsAuthenticated)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuth) => {
        this.isAuthenticated = isAuth;
      });

    this.store
      .select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    console.log(this.isAuthenticated);
    console.log(this.currentUser);
  }

  private updateHeaderType(url: string): void {
    this.headerType = url.includes('/partner') ? 'partner' : 'customer';
  }

  get logoText(): string {
    return this.headerType === 'partner' ? 'UrbanFix Partner' : 'UrbanFix';
  }

  get loginRoute(): string {
    return this.headerType === 'partner' ? '/partner/login' : '/user/login';
  }

  get registerRoute(): string {
    return this.headerType === 'partner'
      ? '/partner/register'
      : '/user/register';
  }

  get registerButtonText(): string {
    return this.headerType === 'partner' ? 'Become a Partner' : 'Sign Up';
  }

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
    this.showProfileDropdown = false;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeDropdown(): void {
    this.showProfileDropdown = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
