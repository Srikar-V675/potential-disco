// src/app/features/partner/pages/bookings/bookings.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  Subject,
  takeUntil,
  filter,
  switchMap,
  tap,
  forkJoin,
  map,
  of
} from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import { BookingService } from '../../../../core/services/booking.service';
import { ServicesService } from '../../../../core/services/services.service';
import { UserService } from '../../../../core/services/user.service';
import { EarningsService } from '../../../../core/services/earnings.service';
import { Booking, BookingStatus } from '../../../../core/models/booking.model';
import { User } from '../../../../core/models/user.model';
import { ServiceEntity } from '../../../../core/models/service.model';

import {
  BookingCardComponent,
  EnrichedBooking
} from '../../components/booking-card/booking-card.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';

type FilterType = 'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    BookingCardComponent,
    SidebarComponent
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class PartnerBookingsComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly bookingService = inject(BookingService);
  private readonly servicesService = inject(ServicesService);
  private readonly userService = inject(UserService);
  private readonly earningsService = inject(EarningsService);
  private readonly destroy$ = new Subject<void>();

  currentUser$ = this.store.select(AuthSelectors.selectCurrentUser);

  bookings: Booking[] = [];
  enrichedBookings: EnrichedBooking[] = [];
  filteredBookings: EnrichedBooking[] = [];
  isLoading = true;
  searchQuery = '';
  selectedFilter: FilterType = 'all';
  currentPartnerId = '';

  services: ServiceEntity[] = [];
  users: User[] = [];

  ngOnInit(): void {
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookings(): void {
    this.currentUser$
      .pipe(
        filter((user): user is User => !!user && !!user.id),
        tap((user) => {
          console.log('📋 Loading bookings for partner:', user.id);
          this.currentPartnerId = user.id;
          this.isLoading = true;
        }),
        switchMap((user) => {
          return forkJoin({
            bookings: this.bookingService.getBookingsByPartnerId(user.id),
            services: this.servicesService.getAllServices(),
            users: this.http.get<User[]>('http://localhost:3000/users')
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ bookings, services, users }) => {
          console.log('✅ Data loaded - Bookings:', bookings.length, 'Services:', services.length, 'Users:', users.length);

          this.bookings = bookings;
          this.services = services;
          this.users = users;
          this.enrichedBookings = this.enrichBookingsWithDetails(bookings);
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to load bookings:', error);
          this.isLoading = false;
        }
      });
  }

  private enrichBookingsWithDetails(bookings: Booking[]): EnrichedBooking[] {
    return bookings.map((booking) => {
      const service = this.services.find(s => s.id === booking.serviceId);
      const user = this.users.find(u => u.id === booking.userId);
      const scheduleDate = new Date(booking.schedule);

      const discount = booking.price * (booking.offerDiscount / 100);
      const finalAmount = booking.price - discount + booking.convenienceFee;

      return {
        ...booking,
        serviceName: service?.title || 'Unknown Service',
        userName: user?.userName || 'Unknown User',
        phone: user?.phoneNumber || 'N/A',
        date: this.formatDate(scheduleDate),
        time: this.formatTime(scheduleDate),
        finalAmount
      };
    });
  }

  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  private formatTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  onFilterChange(filter: FilterType): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.enrichedBookings];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (booking) =>
          booking.userName.toLowerCase().includes(query) ||
          booking.serviceName.toLowerCase().includes(query) ||
          booking.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    switch (this.selectedFilter) {
      case 'pending':
        // Today and tomorrow, confirmed status only
        filtered = filtered.filter((booking) => {
          const bookingDate = new Date(booking.schedule);
          return bookingDate <= tomorrow && booking.status === 'confirmed';
        });
        break;

      case 'upcoming':
        // Beyond tomorrow, confirmed status only
        filtered = filtered.filter((booking) => {
          const bookingDate = new Date(booking.schedule);
          return (
            bookingDate >= dayAfterTomorrow && booking.status === 'confirmed'
          );
        });
        break;

      case 'completed':
        filtered = filtered.filter((booking) => booking.status === 'completed');
        break;

      case 'cancelled':
        filtered = filtered.filter((booking) => booking.status === 'cancelled');
        break;

      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Sort by schedule date (most recent first)
    filtered.sort((a, b) => b.schedule - a.schedule);

    this.filteredBookings = filtered;
  }

  onStatusChange(event: { id: string; newStatus: BookingStatus }): void {
    console.log('🔄 Updating booking status:', event);

    this.bookingService
      .updateBookingStatus(event.id, event.newStatus)
      .pipe(
        switchMap((updatedBooking) => {
          console.log('✅ Booking status updated:', updatedBooking);

          // If status changed to completed, process payment
          if (event.newStatus === 'completed') {
            const enrichedBooking = this.enrichedBookings.find(
              (b) => b.id === event.id
            );

            if (enrichedBooking) {
              console.log('💰 Processing payment for completed booking...');
              return this.earningsService
                .processBookingCompletion(
                  updatedBooking,
                  this.currentPartnerId,
                  enrichedBooking.serviceName,
                  enrichedBooking.userName
                )
                .pipe(
                  tap((transaction) => {
                    console.log('✅ Payment processed:', transaction);
                  }),
                  map(() => updatedBooking)
                );
            }
          }

          return of(updatedBooking);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (updatedBooking) => {
          // Update in bookings array
          const bookingIndex = this.bookings.findIndex(
            (b) => b.id === event.id
          );
          if (bookingIndex !== -1) {
            this.bookings[bookingIndex] = updatedBooking;
          }

          // Update in enriched bookings
          const enrichedIndex = this.enrichedBookings.findIndex(
            (b) => b.id === event.id
          );
          if (enrichedIndex !== -1) {
            this.enrichedBookings[enrichedIndex].status = updatedBooking.status;
          }

          // Reapply filters
          this.applyFilters();
        },
        error: (error) => {
          console.error('❌ Failed to update booking status:', error);
          alert('Failed to update booking status. Please try again.');
        }
      });
  }

  get totalBookings(): number {
    return this.enrichedBookings.length;
  }

  get confirmedBookings(): number {
    return this.enrichedBookings.filter((b) => b.status === 'confirmed').length;
  }

  get completedBookings(): number {
    return this.enrichedBookings.filter((b) => b.status === 'completed').length;
  }

  get cancelledBookings(): number {
    return this.enrichedBookings.filter((b) => b.status === 'cancelled').length;
  }

  getPendingCount(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    return this.enrichedBookings.filter((booking) => {
      const bookingDate = new Date(booking.schedule);
      return bookingDate <= tomorrow && booking.status === 'confirmed';
    }).length;
  }

  getUpcomingCount(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    return this.enrichedBookings.filter((booking) => {
      const bookingDate = new Date(booking.schedule);
      return bookingDate >= dayAfterTomorrow && booking.status === 'confirmed';
    }).length;
  }

  // Add HttpClient for users fetch
  private http = inject(HttpClient);
}
