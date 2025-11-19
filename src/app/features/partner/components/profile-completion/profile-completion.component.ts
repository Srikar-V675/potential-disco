// src/app/features/partner/components/profile-completion/profile-completion.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, map, catchError, of, combineLatest } from 'rxjs';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import * as ServicesSelectors from '../../../../store/services/services.selectors';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { ServicesService } from '../../../../core/services/services.service';
import { EarningsService } from '../../../../core/services/earnings.service';

@Component({
  selector: 'app-profile-completion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-completion.component.html',
  styleUrls: ['./profile-completion.component.scss']
})
export class ProfileCompletionComponent implements OnInit {
  private store = inject(Store);
  private portfolioService = inject(PortfolioService);
  private servicesService = inject(ServicesService);
  private earningsService = inject(EarningsService);

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
    return this.portfolioService
      .getPortfolioByPartnerId(partnerId)
      .pipe(
        map((portfolios) => portfolios && portfolios.length > 0),
        catchError(() => of(false))
      );
  }

  private checkServices(partnerId: string): Observable<number> {
    return this.servicesService
      .getServicesByPartnerId(partnerId)
      .pipe(
        map((services) => services?.length || 0),
        catchError(() => of(0))
      );
  }

  private checkBankDetails(partnerId: string): Observable<boolean> {
    return this.earningsService
      .getPartnerEarnings(partnerId)
      .pipe(
        map((earnings) => !!earnings && !!earnings.id),
        catchError(() => of(false))
      );
  }
}
