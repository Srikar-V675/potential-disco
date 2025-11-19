// src/app/core/guards/partner.guard.ts

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

export const partnerGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectIsAuthenticated),
    store.select(selectUserRole)
  ]).pipe(
    take(1),
    map(([isAuthenticated, role]) => {
      console.log('🔒 Partner Guard - Auth:', isAuthenticated, 'Role:', role);

      // Not authenticated at all
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to partner login');
        router.navigate(['/partner/login']);
        return false;
      }

      // Authenticated but wrong role
      if (role !== 'partner') {
        console.log('❌ Wrong role, redirecting to user home');
        router.navigate(['/home']);
        return false;
      }

      // Authenticated and correct role
      console.log('✅ Partner access granted');
      return true;
    })
  );
};
