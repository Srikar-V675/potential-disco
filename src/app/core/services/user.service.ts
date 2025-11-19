// src/app/core/services/user.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Address, BankAccount, User } from '../models/user.model';
import { Observable, throwError, map, switchMap } from 'rxjs';

// If you already have an environments file, import it. Otherwise, hardcode url for now.
const API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3000'
    : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUserById(id: string): Observable<User> {
    return this.http
      .get<User>(`${API_URL}/users/${id}`)
      .pipe(this.handleHttpError('Failed to fetch user'));
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http
      .patch<User>(`${API_URL}/users/${id}`, data)
      .pipe(this.handleHttpError('Failed to update user'));
  }

  addAddress(userId: string, address: Address): Observable<User> {
    return this.getUserById(userId).pipe(
      switchMap((user) => {
        const addresses = Array.isArray(user.addresses) ? user.addresses : [];
        const updated = { ...user, addresses: [...addresses, address] };
        return this.updateUser(userId, { addresses: updated.addresses });
      })
    );
  }

  updateAddress(
    userId: string,
    addressIndex: number,
    address: Address
  ): Observable<User> {
    return this.getUserById(userId).pipe(
      switchMap((user) => {
        const addresses = Array.isArray(user.addresses)
          ? [...user.addresses]
          : [];
        if (addressIndex < 0 || addressIndex >= addresses.length) {
          return throwError(() => new Error('Invalid address index'));
        }
        addresses[addressIndex] = address;
        return this.updateUser(userId, { addresses });
      })
    );
  }

  deleteAddress(userId: string, addressIndex: number): Observable<User> {
    return this.getUserById(userId).pipe(
      switchMap((user) => {
        const addresses = Array.isArray(user.addresses)
          ? [...user.addresses]
          : [];
        if (addressIndex < 0 || addressIndex >= addresses.length) {
          return throwError(() => new Error('Invalid address index'));
        }
        addresses.splice(addressIndex, 1);
        return this.updateUser(userId, { addresses });
      })
    );
  }

  addBankAccount(userId: string, bankAccount: BankAccount): Observable<User> {
    return this.updateUser(userId, { bankAccount });
  }

  updateBio(userId: string, bio: string): Observable<User> {
    return this.updateUser(userId, { bio });
  }

  updateServiceAreas(userId: string, serviceAreas: string[]): Observable<User> {
    return this.updateUser(userId, { serviceAreas });
  }

  private handleHttpError<T>(fallbackMessage: string) {
    return map((res: T) => res);
  }
}
