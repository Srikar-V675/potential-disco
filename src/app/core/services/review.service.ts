// src/app/core/services/review.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, map, switchMap } from 'rxjs';
import {
  Review,
  ReviewCreate,
  RatingDistribution
} from '../models/review.model';
import { ServiceEntity } from '../models/service.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  getReviewsByPartnerId(partnerId: string): Observable<Review[]> {
    // Reviews are embedded in services, so fetch all services by partner
    return this.http
      .get<ServiceEntity[]>(`${API_URL}/services`, {
        params: { partnerId }
      })
      .pipe(
        map((services) => {
          const allReviews: Review[] = [];
          services.forEach((service) => {
            service.ratings.forEach((rating) => {
              allReviews.push({
                id: crypto.randomUUID(),
                userId: rating.userId,
                serviceId: service.id,
                partnerId: service.partnerId,
                rating: rating.rating,
                comment: rating.comment,
                createdAt: rating.createdAt || Date.now()
              });
            });
          });
          return allReviews;
        }),
        catchError(this.handleError)
      );
  }

  getReviewsByServiceId(serviceId: string): Observable<Review[]> {
    return this.http
      .get<ServiceEntity>(`${API_URL}/services/${serviceId}`)
      .pipe(
        map((service) =>
          service.ratings.map((rating) => ({
            id: crypto.randomUUID(),
            userId: rating.userId,
            serviceId: service.id,
            partnerId: service.partnerId,
            rating: rating.rating,
            comment: rating.comment,
            createdAt: rating.createdAt || Date.now()
          }))
        ),
        catchError(this.handleError)
      );
  }

  createReview(review: ReviewCreate): Observable<Review> {
    // Add rating to service
    return this.http
      .get<ServiceEntity>(`${API_URL}/services/${review.serviceId}`)
      .pipe(
        map((service) => {
          const newRating = {
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            createdAt: Date.now()
          };

          const updatedService = {
            ...service,
            ratings: [...service.ratings, newRating]
          };

          return { service: updatedService, rating: newRating };
        }),
        switchMap(({ service, rating }) =>
          this.http
            .patch<ServiceEntity>(`${API_URL}/services/${review.serviceId}`, {
              ratings: service.ratings
            })
            .pipe(
              map(() => ({
                id: crypto.randomUUID(),
                ...review,
                createdAt: Date.now()
              }))
            )
        ),
        catchError(this.handleError)
      );
  }

  calculateAverageRating(reviews: Review[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  getRatingDistribution(reviews: Review[]): RatingDistribution {
    const distribution: RatingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      total: reviews.length,
      average: this.calculateAverageRating(reviews)
    };

    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return distribution;
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error?.message || error.message || 'Something went wrong';
    return throwError(() => new Error(message));
  }
}
