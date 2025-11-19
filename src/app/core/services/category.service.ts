// src/app/core/services/category.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Category } from '../models/category.model';
import { Observable, catchError, throwError } from 'rxjs';

// Replace with environment import if available
const API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3000'
    : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  /**
   * Fetch all categories
   * GET /categories
   */
  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${API_URL}/categories`)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(
            () => new Error(err.message || 'Failed to fetch categories')
          )
        )
      );
  }
}
