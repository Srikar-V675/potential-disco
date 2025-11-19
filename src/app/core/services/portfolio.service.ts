import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

const API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3000'
    : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';

export interface Portfolio {
  id: string;
  partnerId: string;
  imageUrl: string;
  caption: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);

  /**
   * Get all portfolio items
   */
  getAllPortfolio(): Observable<Portfolio[]> {
    return this.http
      .get<Portfolio[]>(`${API_URL}/portfolio`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get portfolio items by partner ID
   */
  getPortfolioByPartnerId(partnerId: string): Observable<Portfolio[]> {
    return this.http
      .get<Portfolio[]>(`${API_URL}/portfolio`, {
        params: { partnerId }
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single portfolio item by ID
   */
  getPortfolioById(id: string): Observable<Portfolio> {
    return this.http
      .get<Portfolio>(`${API_URL}/portfolio/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new portfolio item
   */
  createPortfolio(portfolio: Omit<Portfolio, 'id'>): Observable<Portfolio> {
    const newPortfolio: Portfolio = {
      ...portfolio,
      id: crypto.randomUUID()
    };

    return this.http
      .post<Portfolio>(`${API_URL}/portfolio`, newPortfolio)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update a portfolio item
   */
  updatePortfolio(id: string, updates: Partial<Portfolio>): Observable<Portfolio> {
    return this.http
      .patch<Portfolio>(`${API_URL}/portfolio/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a portfolio item
   */
  deletePortfolio(id: string): Observable<void> {
    return this.http
      .delete<void>(`${API_URL}/portfolio/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error?.message || error.message || 'Portfolio operation failed';
    return throwError(() => new Error(message));
  }
}
