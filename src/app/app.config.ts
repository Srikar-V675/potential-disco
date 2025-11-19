// src/app/app.config.ts

import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import * as AuthActions from './store/auth/auth.actions';
import { routes } from './app.routes';

function initializeAuth(store: Store) {
  return () => {
    store.dispatch(AuthActions.loadUserFromStorage());
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [Store],
      multi: true
    }
  ]
};
