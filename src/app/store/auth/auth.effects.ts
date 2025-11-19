// src/app/store/auth/auth.effects.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, EMPTY } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) => {
            if (credentials.role && response.user.role !== credentials.role) {
              return AuthActions.loginFailure({
                error: `This login is for ${credentials.role}s only`
              });
            }
            return AuthActions.loginSuccess({
              user: response.user,
              token: response.token
            });
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ user }) => {
          if (user.role === 'partner') {
            this.router.navigate(['/partner/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ data }) =>
        this.authService.register(data).pipe(
          map((response) =>
            AuthActions.registerSuccess({
              user: response.user,
              token: response.token
            })
          ),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.message }))
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ user }) => {
          if (user.role === 'partner') {
            this.router.navigate(['/partner/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          // Clear localStorage
          this.authService.clearStorage();

          // Navigate to login
          const currentUrl = this.router.url;
          if (
            !currentUrl.includes('/login') &&
            !currentUrl.includes('/landing')
          ) {
            this.router.navigate(['/partner/login']);
          }
        })
      ),
    { dispatch: false }
  );

  // FIX: Don't dispatch logout when no user - just return EMPTY
  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      switchMap(() => {
        const { user, token } = this.authService.getUserAndTokenFromStorage();

        if (token && user) {
          return of(AuthActions.loadUserFromStorageSuccess({ user, token }));
        }

        // Don't dispatch logout - just do nothing
        return EMPTY;
      })
    )
  );
}
