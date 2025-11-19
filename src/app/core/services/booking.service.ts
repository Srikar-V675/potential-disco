// src/app/core/services/booking.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, map, forkJoin } from 'rxjs';
import {
  Booking,
  BookingCreate,
  BookingStatus,
  BookingWithDetails
} from '../models/booking.model';
import { ServiceEntity } from '../models/service.model';

const API_URL = 'http://localhost:3000';
const CONVENIENCE_FEE = 50;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);

  getAllBookings(): Observable<Booking[]> {
    return this.http
      .get<Booking[]>(`${API_URL}/bookings`)
      .pipe(catchError(this.handleError));
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http
      .get<Booking>(`${API_URL}/bookings/${id}`)
      .pipe(catchError(this.handleError));
  }

  getBookingsByUserId(userId: string): Observable<Booking[]> {
    return this.http
      .get<Booking[]>(`${API_URL}/bookings`, {
        params: { userId }
      })
      .pipe(catchError(this.handleError));
  }

  getBookingsByPartnerId(partnerId: string): Observable<Booking[]> {
    // Fetch both bookings and services, then join them
    return forkJoin({
      bookings: this.getAllBookings(),
      services: this.http.get<ServiceEntity[]>(`${API_URL}/services`)
    }).pipe(
      map(({ bookings, services }) => {
        console.log('🔍 Total bookings from API:', bookings.length);
        console.log('🔍 Total services from API:', services.length);
        console.log('🔍 Looking for partner:', partnerId);

        // Create a map of serviceId -> partnerId for quick lookup
        const servicePartnerMap = new Map<string, string>();
        services.forEach((service) => {
          servicePartnerMap.set(service.id, service.partnerId);
        });

        // Filter bookings by matching serviceId to partnerId
        const partnerBookings = bookings.filter((booking) => {
          const bookingPartnerId = servicePartnerMap.get(booking.serviceId);
          const matches = bookingPartnerId === partnerId;
          if (matches) {
            console.log('✅ Found booking:', booking.id, 'for service:', booking.serviceId);
          }
          return matches;
        });

        console.log('🔍 Partner bookings found:', partnerBookings.length);
        return partnerBookings;
      }),
      catchError(this.handleError)
    );
  }

  createBooking(booking: BookingCreate): Observable<Booking> {
    const newBooking: Booking = {
      id: crypto.randomUUID(),
      ...booking,
      convenienceFee: CONVENIENCE_FEE,
      status: 'confirmed',
      createdAt: Date.now()
    };

    return this.http
      .post<Booking>(`${API_URL}/bookings`, newBooking)
      .pipe(catchError(this.handleError));
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    const update: Partial<Booking> = { status };

    if (status === 'completed') {
      update.completedAt = Date.now();
    } else if (status.startsWith('cancelled')) {
      update.cancelledAt = Date.now();
    }

    return this.http
      .patch<Booking>(`${API_URL}/bookings/${id}`, update)
      .pipe(catchError(this.handleError));
  }

  cancelBooking(id: string): Observable<Booking> {
    const status: BookingStatus = 'cancelled';
    return this.updateBookingStatus(id, status);
  }

  filterBookingsByStatus(bookings: Booking[], filter: string): Booking[] {
    if (filter === 'all') return bookings;
    return bookings.filter((b) => b.status === filter);
  }

  calculateFinalAmount(booking: Booking): number {
    const discount = booking.price * (booking.offerDiscount / 100);
    return booking.price - discount + booking.convenienceFee;
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error?.message || error.message || 'Something went wrong';
    return throwError(() => new Error(message));
  }
}
