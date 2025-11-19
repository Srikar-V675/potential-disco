// src/app/shared/components/header/header.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { User } from '../../../../core/models/user.model';
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../../store/auth/auth.selectors';
import * as AuthActions from '../../../../store/auth/auth.actions';
import { SearchService } from '../../../../core/services/search.service';

type HeaderType = 'partner' | 'customer';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private searchService = inject(SearchService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  headerType: HeaderType = 'customer';
  isAuthenticated = false;
  currentUser: User | null = null;
  searchQuery = '';
  showSearchBar = false;

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

    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchService.setSearchQuery(query);
    });
  }

  private updateHeaderType(url: string): void {
    this.headerType = url.includes('/partner') ? 'partner' : 'customer';
    // Show search bar only on user dashboard
    this.showSearchBar = this.isAuthenticated &&
      this.headerType === 'customer' &&
      url.includes('/dashboard');
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;

    if (query.trim()) {
      this.searchService.setShowResults(true);
      this.searchSubject.next(query);
    } else {
      this.searchService.clearSearch();
    }
  }

  goToProfile() {
    this.router.navigate(['/user/profile']);
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
