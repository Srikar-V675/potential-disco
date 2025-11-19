// src/app/features/partner/components/profile-completion/profile-completion.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, combineLatest } from 'rxjs';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import * as ServicesSelectors from '../../../../store/services/services.selectors';

const API_URL = 'http://localhost:3000';

@Component({
  selector: 'app-profile-completion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-completion.component.html',
  styleUrls: ['./profile-completion.component.scss']
})
export class ProfileCompletionComponent implements OnInit {
  private http = inject(HttpClient);
  private store = inject(Store);

  completionPercentage = 0;
  completionSteps = [
    { label: 'Basic Profile', completed: true, detail: 'Completed' },
    { label: 'Services', completed: false, detail: '0 Added' },
    { label: 'Portfolio', completed: false, detail: 'Pending' },
    { label: 'Bank Details', completed: false, detail: 'Pending' }
  ];

  ngOnInit() {
    // Get current user and calculate completion
    this.store.select(AuthSelectors.selectCurrentUser).subscribe((user) => {
      if (user) {
        this.calculateCompletion(user.id);
      }
    });
  }

  private calculateCompletion(partnerId: string) {
    combineLatest([
      this.checkPortfolio(partnerId),
      this.checkServices(partnerId),
      this.checkBankDetails(partnerId)
    ]).subscribe(([hasPortfolio, servicesCount, hasBankDetails]) => {
      // Update portfolio step
      const portfolioStep = this.completionSteps.find(
        (s) => s.label === 'Portfolio'
      );
      if (portfolioStep) {
        portfolioStep.completed = hasPortfolio;
        portfolioStep.detail = hasPortfolio ? 'Completed' : 'Pending';
      }

      // Update services step
      const servicesStep = this.completionSteps.find(
        (s) => s.label === 'Services'
      );
      if (servicesStep) {
        servicesStep.completed = servicesCount > 0;
        servicesStep.detail =
          servicesCount > 0 ? `${servicesCount} Added` : '0 Added';
      }

      // Update bank details step
      const bankStep = this.completionSteps.find(
        (s) => s.label === 'Bank Details'
      );
      if (bankStep) {
        bankStep.completed = hasBankDetails;
        bankStep.detail = hasBankDetails ? 'Completed' : 'Pending';
      }

      this.updatePercentage();
    });
  }

  private updatePercentage() {
    const completed = this.completionSteps.filter((s) => s.completed).length;
    this.completionPercentage = Math.round(
      (completed / this.completionSteps.length) * 100
    );
  }

  private checkPortfolio(partnerId: string): Observable<boolean> {
    return this.http
      .get<any[]>(`${API_URL}/portfolio`, {
        params: { partnerId }
      })
      .pipe(
        map((portfolios) => portfolios && portfolios.length > 0),
        catchError(() => of(false))
      );
  }

  private checkServices(partnerId: string): Observable<number> {
    return this.http
      .get<any[]>(`${API_URL}/services`, {
        params: { partnerId }
      })
      .pipe(
        map((services) => services?.length || 0),
        catchError(() => of(0))
      );
  }

  private checkBankDetails(partnerId: string): Observable<boolean> {
    return this.http
      .get<any[]>(`${API_URL}/earnings`, {
        params: { partnerId }
      })
      .pipe(
        map((earnings) => earnings && earnings.length > 0),
        catchError(() => of(false))
      );
  }
}
