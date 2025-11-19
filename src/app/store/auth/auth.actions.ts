// src/app/store/auth/auth.actions.ts

import { createAction, props } from '@ngrx/store';
import { User, LoginDTO, RegisterDTO } from '../../core/models/user.model';

// Login Actions
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginDTO }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register Actions
export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterDTO }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User; token: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout Action
export const logout = createAction('[Auth] Logout');

// Load User from Storage (SSR-safe)
export const loadUserFromStorage = createAction(
  '[Auth] Load User From Storage'
);

export const loadUserFromStorageSuccess = createAction(
  '[Auth] Load User From Storage Success',
  props<{ user: User; token: string }>()
);

// Update User (after profile edit)
export const updateCurrentUser = createAction(
  '[Auth] Update Current User',
  props<{ user: User }>()
);
