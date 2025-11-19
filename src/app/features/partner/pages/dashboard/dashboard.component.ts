// src/app/features/partner/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  Observable,
  combineLatest,
  map,
  switchMap,
  filter,
  tap,
  Subject,
  takeUntil,
  catchError,
  of
} from 'rxjs';

import * as AuthSelectors from '../../../../store/auth/auth.selectors';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { ProfileCompletionComponent } from '../../components/profile-completion/profile-completion.component';
import { QuickActionsComponent } from '../../components/quick-actions/quick-actions.component';
import { GettingStartedComponent } from '../../components/getting-started/getting-started.component';

import { BookingService } from '../../../../core/services/booking.service';
import { EarningsService } from '../../../../core/services/earnings.service';
import { ReviewService } from '../../../../core/services/review.service';
import { ServicesService } from '../../../../core/services/services.service';

import { User } from '../../../../core/models/user.model';

interface DashboardStats {
  totalBookings: number;
  servicesListed: number;
  totalEarnings: number;
  averageRating: number;
}

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    ProfileCompletionComponent,
    QuickActionsComponent,
    GettingStartedComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class PartnerDashboardComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly servicesService = inject(ServicesService);
  private readonly bookingService = inject(BookingService);
  private readonly earningsService = inject(EarningsService);
  private readonly reviewService = inject(ReviewService);
  private readonly destroy$ = new Subject<void>();

  // Observables
  currentUser$ = this.store.select(AuthSelectors.selectCurrentUser);
  partnerName$ = this.currentUser$.pipe(
    map((user) => user?.userName || 'Partner')
  );
  stats$!: Observable<DashboardStats>;
  isLoading$ = new Subject<boolean>();

  ngOnInit(): void {
    this.initializeStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeStats(): void {
    this.stats$ = this.currentUser$.pipe(
      // Only proceed if we have a valid user with an ID
      filter((user): user is User => this.isValidUser(user)),

      tap((user) => this.logUserInfo(user)),

      // Switch to data fetching
      switchMap((user) => this.fetchDashboardData(user.id)),

      // Handle any errors gracefully
      catchError((error) => {
        console.error('❌ Error loading dashboard stats:', error);
        return of(this.getEmptyStats());
      }),

      takeUntil(this.destroy$)
    );
  }

  private fetchDashboardData(partnerId: string): Observable<DashboardStats> {
    this.isLoading$.next(true);

    return combineLatest([
      this.servicesService.getServicesByPartnerId(partnerId).pipe(
        tap((services) => console.log('✅ Services loaded:', services.length)),
        catchError((error) => {
          console.error('❌ Failed to load services:', error);
          return of([]);
        })
      ),

      this.bookingService.getBookingsByPartnerId(partnerId).pipe(
        tap((bookings) => console.log('✅ Bookings loaded:', bookings.length)),
        catchError((error) => {
          console.error('❌ Failed to load bookings:', error);
          return of([]);
        })
      ),

      this.earningsService.calculateEarnings(partnerId).pipe(
        tap((earnings) =>
          console.log('✅ Earnings calculated:', earnings.totalEarnings)
        ),
        catchError((error) => {
          console.error('❌ Failed to calculate earnings:', error);
          return of({
            totalEarnings: 0,
            availableBalance: 0,
            thisMonthEarnings: 0
          });
        })
      ),

      this.reviewService.getReviewsByPartnerId(partnerId).pipe(
        tap((reviews) => console.log('✅ Reviews loaded:', reviews.length)),
        catchError((error) => {
          console.error('❌ Failed to load reviews:', error);
          return of([]);
        })
      )
    ]).pipe(
      map(([services, bookings, earnings, reviews]) => {
        this.isLoading$.next(false);

        const averageRating =
          this.reviewService.calculateAverageRating(reviews);

        const stats: DashboardStats = {
          totalBookings: bookings.length,
          servicesListed: services.length,
          totalEarnings: earnings.totalEarnings,
          averageRating: averageRating
        };

        console.log('📊 Dashboard Stats:', stats);
        return stats;
      })
    );
  }

  private isValidUser(user: User | null): user is User {
    return !!user && !!user.id;
  }

  private logUserInfo(user: User): void {
    console.log('👤 Partner:', user.userName, '| ID:', user.id);
  }

  private getEmptyStats(): DashboardStats {
    return {
      totalBookings: 0,
      servicesListed: 0,
      totalEarnings: 0,
      averageRating: 0
    };
  }
}
