// src/app/core/services/earnings.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  throwError,
  catchError,
  map,
  switchMap,
  forkJoin
} from 'rxjs';
import {
  Earning,
  Transaction,
  EarningsSummary,
  PayoutRequest
} from '../models/earning.model';
import { Booking } from '../models/booking.model';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class EarningsService {
  private http = inject(HttpClient);

  getPartnerEarnings(partnerId: string): Observable<Earning> {
    return this.http
      .get<Earning[]>(`${API_URL}/earnings`, {
        params: { partnerId }
      })
      .pipe(
        map((earnings) => earnings[0] || this.createEmptyEarning(partnerId)),
        catchError(this.handleError)
      );
  }

  processBookingCompletion(
    booking: Booking,
    partnerId: string,
    serviceName: string,
    userName: string
  ): Observable<Transaction> {
    // Calculate partner earnings (price - discount, NO convenience fee)
    const discount = booking.price * (booking.offerDiscount / 100);
    const partnerEarnings = booking.price - discount;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      partnerId: partnerId,
      bookingId: booking.id,
      title: serviceName,
      from: userName,
      dateTime: Date.now(),
      amount: partnerEarnings,
      type: 'earning'
    };

    return this.http
      .post<Transaction>(`${API_URL}/transactions`, transaction)
      .pipe(
        switchMap((trans) =>
          this.updateEarningsBalance(partnerId, partnerEarnings).pipe(
            map(() => trans)
          )
        ),
        catchError(this.handleError)
      );
  }

  requestPayout(request: PayoutRequest): Observable<Transaction> {
    const MIN_PAYOUT = 1000;

    return this.getPartnerEarnings(request.partnerId).pipe(
      switchMap((earning) => {
        if (earning.balance < request.amount) {
          return throwError(() => new Error('Insufficient balance'));
        }

        if (request.amount < MIN_PAYOUT) {
          return throwError(() => new Error(`Minimum payout amount is ₹${MIN_PAYOUT}`));
        }

        if (!request.bankAccount) {
          return throwError(() => new Error('Bank account details required'));
        }

        const transaction: Transaction = {
          id: crypto.randomUUID(),
          partnerId: request.partnerId,
          title: 'Payout to Bank',
          from: 'Wallet',
          dateTime: Date.now(),
          amount: request.amount,
          type: 'payout',
          toBankAccount: request.bankAccount
        };

        return this.http
          .post<Transaction>(`${API_URL}/transactions`, transaction)
          .pipe(
            switchMap((trans) =>
              this.updateEarningsBalance(
                request.partnerId,
                -request.amount
              ).pipe(map(() => trans))
            )
          );
      }),
      catchError(this.handleError)
    );
  }

  getTransactionHistory(partnerId: string): Observable<Transaction[]> {
    return this.http
      .get<Transaction[]>(`${API_URL}/transactions`, {
        params: { partnerId }
      })
      .pipe(catchError(this.handleError));
  }

  getPayoutHistory(partnerId: string): Observable<Transaction[]> {
    return this.getTransactionHistory(partnerId).pipe(
      map((transactions) => transactions.filter((t) => t.type === 'payout'))
    );
  }

  calculateEarnings(partnerId: string): Observable<EarningsSummary> {
    return forkJoin({
      earning: this.getPartnerEarnings(partnerId),
      transactions: this.getTransactionHistory(partnerId),
      bookings: this.http.get<Booking[]>(`${API_URL}/bookings`)
    }).pipe(
      map(({ earning, transactions, bookings }) => {
        const completedBookings = bookings.filter(
          (b) => b.status === 'completed'
        );
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const thisMonthTransactions = transactions.filter((t) => {
          const date = new Date(t.dateTime);
          return (
            date.getMonth() === thisMonth &&
            date.getFullYear() === thisYear &&
            t.type === 'earning'
          );
        });

        const thisMonthEarnings = thisMonthTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        const pendingPayouts = transactions.filter(
          (t) => t.type === 'payout' && !t.toBankAccount
        ).length;

        return {
          totalEarnings: earning.earnings,
          availableBalance: earning.balance,
          pendingPayouts,
          completedBookings: completedBookings.length,
          thisMonthEarnings
        };
      }),
      catchError(this.handleError)
    );
  }

  private updateEarningsBalance(
    partnerId: string,
    amount: number
  ): Observable<Earning> {
    return this.getPartnerEarnings(partnerId).pipe(
      switchMap((earning) => {
        const updated: Earning = {
          ...earning,
          earnings: earning.earnings + (amount > 0 ? amount : 0),
          balance: earning.balance + amount
        };

        if (earning.id) {
          return this.http.patch<Earning>(
            `${API_URL}/earnings/${earning.id}`,
            updated
          );
        } else {
          return this.http.post<Earning>(`${API_URL}/earnings`, updated);
        }
      })
    );
  }

  private createEmptyEarning(partnerId: string): Earning {
    return {
      id: '',
      partnerId,
      earnings: 0,
      balance: 0
    };
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error?.message || error.message || 'Something went wrong';
    return throwError(() => new Error(message));
  }
}
