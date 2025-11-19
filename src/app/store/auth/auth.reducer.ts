// src/app/store/auth/auth.reducer.ts

import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
    isAuthenticated: true
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),

  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
    isAuthenticated: true
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),

  // Logout
  on(AuthActions.logout, () => initialState),

  // Load from storage - ADD THIS!
  on(AuthActions.loadUserFromStorage, (state) => ({
    ...state,
    loading: true
  })),

  on(AuthActions.loadUserFromStorageSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false, // Add this!
    isAuthenticated: true
  })),

  // Update current user
  on(AuthActions.updateCurrentUser, (state, { user }) => ({
    ...state,
    user
  }))
);
