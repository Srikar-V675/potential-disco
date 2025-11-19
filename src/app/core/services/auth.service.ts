// src/app/core/services/auth.service.ts

import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, map, switchMap, catchError, of } from 'rxjs';
import {
  AuthResponse,
  LoginDTO,
  RegisterDTO,
  User
} from '../models/user.model';

const API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3000'
    : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private TOKEN_KEY = 'urbanfix_token';
  private USER_KEY = 'urbanfix_user';

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    }
  }

  private getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
  }

  register(data: RegisterDTO): Observable<AuthResponse> {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();

    return this.http
      .get<User[]>(`${API_URL}/users`, {
        params: { email: data.email }
      })
      .pipe(
        switchMap((users) => {
          if (users && users.length > 0) {
            return throwError(() => new Error('Email already registered'));
          }

          const userToCreate: User = {
            id,
            userName: data.userName,
            phoneNumber: data.phoneNumber,
            role: data.role,
            email: data.email,
            bio: data.bio,
            addresses: [],
            password: data.password
          };

          return this.http.post<User>(`${API_URL}/users`, userToCreate);
        }),
        map((createdUser) => {
          const user: User = { ...createdUser };
          this.setItem(this.TOKEN_KEY, token);
          this.setItem(this.USER_KEY, JSON.stringify(user));
          return { user, token };
        }),
        catchError((err: HttpErrorResponse | Error) => {
          const message = this.normalizeError(err, 'Registration failed');
          return throwError(() => new Error(message));
        })
      );
  }

  login(credentials: LoginDTO): Observable<AuthResponse> {
    return this.http
      .get<User[]>(`${API_URL}/users`, {
        params: { email: credentials.email }
      })
      .pipe(
        switchMap((users) => {
          const user = users?.[0];
          if (!user) {
            return throwError(() => new Error('Invalid email or password'));
          }
          if (user.password !== credentials.password) {
            return throwError(() => new Error('Invalid email or password'));
          }

          const token = crypto.randomUUID();
          this.setItem(this.TOKEN_KEY, token);
          this.setItem(this.USER_KEY, JSON.stringify(user));
          return of({ user, token } as AuthResponse);
        }),
        catchError((err: HttpErrorResponse | Error) => {
          const message = this.normalizeError(err, 'Login failed');
          return throwError(() => new Error(message));
        })
      );
  }

  // FIX: Remove the store.dispatch - let the effect handle it
  logout(): void {
    // DON'T dispatch here - the effect will handle store cleanup
    this.clearStorage();
  }

  // New method for clearing storage (called by effect)
  clearStorage(): void {
    this.removeItem(this.TOKEN_KEY);
    this.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getCurrentUser(): User | null {
    const value = this.getItem(this.USER_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value) as User;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getItem(this.TOKEN_KEY);
  }

  getUserAndTokenFromStorage(): { user: User | null; token: string | null } {
    return {
      user: this.getCurrentUser(),
      token: this.getToken()
    };
  }

  private normalizeError(
    err: HttpErrorResponse | Error,
    fallback: string
  ): string {
    if ('status' in err) {
      if (
        err.error &&
        typeof err.error === 'object' &&
        'message' in err.error
      ) {
        return (err.error as any).message ?? fallback;
      }
      return err.message || fallback;
    }
    return err.message || fallback;
  }
}
