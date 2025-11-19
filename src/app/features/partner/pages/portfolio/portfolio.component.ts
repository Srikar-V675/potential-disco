import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../../../core/models/user.model';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import { PortfolioService, Portfolio } from '../../../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private store = inject(Store);

  portfolioItems: Portfolio[] = [];
  loading = true;

  ngOnInit() {
    this.store.select(AuthSelectors.selectCurrentUser).pipe(
      filter((user): user is User => !!user && !!user.id)
    ).subscribe(user => {
      this.loadPortfolio(user.id);
    });
  }

  loadPortfolio(partnerId: string) {
    this.portfolioService.getPortfolioByPartnerId(partnerId).subscribe({
      next: (items) => {
        this.portfolioItems = items;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading portfolio:', err);
        this.loading = false;
      }
    });
  }
}
