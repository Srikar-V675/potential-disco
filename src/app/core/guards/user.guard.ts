// src/app/core/guards/user.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import {
  selectIsAuthenticated,
  selectUserRole
} from '../../store/auth/auth.selectors';
import { combineLatest } from 'rxjs';

export const userGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectIsAuthenticated),
    store.select(selectUserRole)
  ]).pipe(
    take(1),
    map(([isAuthenticated, role]) => {
      console.log('🔒 User Guard - Auth:', isAuthenticated, 'Role:', role);

      // Not authenticated at all
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to user login');
        router.navigate(['/login']);
        return false;
      }

      // Authenticated but wrong role
      if (role !== 'user') {
        console.log('❌ Wrong role, redirecting to partner dashboard');
        router.navigate(['/partner/dashboard']);
        return false;
      }

      // Authenticated and correct role
      console.log('✅ User access granted');
      return true;
    })
  );
};
