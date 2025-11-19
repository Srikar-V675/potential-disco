// src/app/core/services/services.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map, switchMap } from 'rxjs';
import {
  ServiceCreateDTO,
  ServiceEntity,
  ServiceFilter,
  ServiceUpdateDTO,
  ServiceWithCalculatedPrice
} from '../models/service.model';

// Replace with environment import if available
const API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3000'
    : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private http = inject(HttpClient);

  // ============= CREATE =============

  /**
   * Create a new service entry
   * POST /services
   */
  createService(payload: ServiceCreateDTO): Observable<ServiceEntity> {
    const serviceToCreate = {
      ...payload,
      id: crypto.randomUUID(),
      ratings: payload.ratings || []
    };

    return this.http
      .post<ServiceEntity>(`${API_URL}/services`, serviceToCreate)
      .pipe(catchError(this.handleError));
  }

  // ============= READ =============

  /**
   * Get all services
   * GET /services
   */
  getAllServices(): Observable<ServiceEntity[]> {
    return this.http
      .get<ServiceEntity[]>(`${API_URL}/services`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single service by ID
   * GET /services/:id
   */
  getServiceById(id: string): Observable<ServiceEntity> {
    return this.http
      .get<ServiceEntity>(`${API_URL}/services/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all services for a specific category
   * GET /services?categoryId={categoryId}
   */
  getServicesByCategory(categoryId: string): Observable<ServiceEntity[]> {
    return this.http
      .get<ServiceEntity[]>(`${API_URL}/services`, {
        params: { categoryId }
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all services created by a specific partner
   * GET /services?partnerId={partnerId}
   */
  getServicesByPartnerId(partnerId: string): Observable<ServiceEntity[]> {
    return this.http
      .get<ServiceEntity[]>(`${API_URL}/services`, {
        params: { partnerId }
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Search services by query (title search)
   * GET /services?q={query}
   */
  searchServices(query: string): Observable<ServiceEntity[]> {
    return this.http
      .get<ServiceEntity[]>(`${API_URL}/services`, {
        params: { q: query }
      })
      .pipe(catchError(this.handleError));
  }

  // ============= UPDATE =============

  /**
   * Update a service (partial update)
   * PATCH /services/:id
   */
  updateService(
    id: string,
    updates: ServiceUpdateDTO
  ): Observable<ServiceEntity> {
    return this.http
      .patch<ServiceEntity>(`${API_URL}/services/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  /**
   * Toggle service active status
   * PATCH /services/:id
   */
  toggleServiceActive(id: string, active: boolean): Observable<ServiceEntity> {
    return this.updateService(id, { active });
  }

  /**
   * Add a rating to a service
   * PATCH /services/:id
   */
  addRatingToService(
    serviceId: string,
    rating: { userId: string; rating: number; comment: string }
  ): Observable<ServiceEntity> {
    return this.getServiceById(serviceId).pipe(
      map((service) => {
        const updatedRatings = [...service.ratings, rating];
        return { ...service, ratings: updatedRatings };
      }),
      switchMap((updatedService) =>
        this.http.patch<ServiceEntity>(`${API_URL}/services/${serviceId}`, {
          ratings: updatedService.ratings
        })
      ),
      catchError(this.handleError)
    );
  }

  // ============= DELETE =============

  /**
   * Delete a service
   * DELETE /services/:id
   */
  deleteService(id: string): Observable<void> {
    return this.http
      .delete<void>(`${API_URL}/services/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivate a service (soft delete - sets active to false)
   * PATCH /services/:id
   */
  deactivateService(id: string): Observable<ServiceEntity> {
    return this.toggleServiceActive(id, false);
  }

  // ============= FILTERING & SEARCH =============

  /**
   * Filter services based on multiple criteria (client-side)
   */
  filterServices(filters: ServiceFilter): Observable<ServiceEntity[]> {
    return this.getAllServices().pipe(
      map((services) => this.applyFilters(services, filters))
    );
  }

  /**
   * Get active services only
   */
  getActiveServices(): Observable<ServiceEntity[]> {
    return this.getAllServices().pipe(
      map((services) => services.filter((s) => s.active))
    );
  }

  /**
   * Get services with offers
   */
  getServicesWithOffers(): Observable<ServiceEntity[]> {
    return this.getAllServices().pipe(
      map((services) => services.filter((s) => s.hasOffer && s.active))
    );
  }

  // ============= CALCULATIONS & UTILITIES =============

  /**
   * Calculate final price after applying offer discount
   */
  calculateFinalPrice(service: ServiceEntity): number {
    if (service.hasOffer && service.offerDiscount > 0) {
      const discount = service.price * (service.offerDiscount / 100);
      return Math.round((service.price - discount) * 100) / 100;
    }
    return service.price;
  }

  /**
   * Calculate average rating from ratings array
   */
  calculateAverageRating(ratings: { rating: number }[]): number {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  /**
   * Enrich a service with calculated fields
   */
  enrichService(service: ServiceEntity): ServiceWithCalculatedPrice {
    return {
      ...service,
      finalPrice: this.calculateFinalPrice(service),
      averageRating: this.calculateAverageRating(service.ratings),
      totalReviews: service.ratings.length
    };
  }

  /**
   * Enrich multiple services
   */
  enrichServices(services: ServiceEntity[]): ServiceWithCalculatedPrice[] {
    return services.map((service) => this.enrichService(service));
  }

  /**
   * Sort services by price (ascending or descending)
   */
  sortByPrice(
    services: ServiceEntity[],
    order: 'asc' | 'desc' = 'asc'
  ): ServiceEntity[] {
    return [...services].sort((a, b) => {
      const priceA = this.calculateFinalPrice(a);
      const priceB = this.calculateFinalPrice(b);
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }

  /**
   * Sort services by rating (descending)
   */
  sortByRating(services: ServiceEntity[]): ServiceEntity[] {
    return [...services].sort((a, b) => {
      const ratingA = this.calculateAverageRating(a.ratings);
      const ratingB = this.calculateAverageRating(b.ratings);
      return ratingB - ratingA;
    });
  }

  // ============= PRIVATE HELPERS =============

  private applyFilters(
    services: ServiceEntity[],
    filters: ServiceFilter
  ): ServiceEntity[] {
    return services.filter((service) => {
      // Category filter
      if (filters.categoryId && service.categoryId !== filters.categoryId) {
        return false;
      }

      // Partner filter
      if (filters.partnerId && service.partnerId !== filters.partnerId) {
        return false;
      }

      // Active filter
      if (filters.active !== undefined && service.active !== filters.active) {
        return false;
      }

      // Offer filter
      if (
        filters.hasOffer !== undefined &&
        service.hasOffer !== filters.hasOffer
      ) {
        return false;
      }

      // Price type filter
      if (filters.priceType && service.priceType !== filters.priceType) {
        return false;
      }

      // Price range filter (uses final price after discount)
      const finalPrice = this.calculateFinalPrice(service);
      if (filters.priceMin !== undefined && finalPrice < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== undefined && finalPrice > filters.priceMax) {
        return false;
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        const avgRating = this.calculateAverageRating(service.ratings);
        if (avgRating < filters.minRating) {
          return false;
        }
      }

      // Search query filter (searches in title only)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const titleMatch = service.title.toLowerCase().includes(query);
        if (!titleMatch) {
          return false;
        }
      }

      return true;
    });
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error?.message || error.message || 'Service operation failed';
    return throwError(() => new Error(message));
  }
}
