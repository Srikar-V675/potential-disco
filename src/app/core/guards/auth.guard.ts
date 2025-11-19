// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import {
  selectIsAuthenticated,
  selectUserRole
} from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        // Default to partner login if role is unknown
        router.navigate(['/partner/login']);
        return false;
      }
      return true;
    })
  );
};
