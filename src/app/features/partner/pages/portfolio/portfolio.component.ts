import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../../../core/models/user.model';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';

interface Portfolio {
  id: string;
  partnerId: string;
  imageUrl: string;
  caption: string;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  private http = inject(HttpClient);
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
    this.http.get<Portfolio[]>('http://localhost:3000/portfolio', {
      params: { partnerId }
    }).subscribe({
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
