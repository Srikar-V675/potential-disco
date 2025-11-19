// src/app/features/partner/components/quick-actions/quick-actions.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  actions: QuickAction[] = [
    {
      title: 'Add New Service',
      icon: '➕',
      route: '/partner/services/new',
      description: 'List a new service offering'
    },
    {
      title: 'Upload Portfolio',
      icon: '🖼️',
      route: '/partner/portfolio/upload',
      description: 'Showcase your work'
    },
    {
      title: 'View Bookings',
      icon: '📅',
      route: '/partner/bookings',
      description: 'Check upcoming appointments'
    },
    {
      title: 'Withdraw Earnings',
      icon: '💸',
      route: '/partner/earnings/withdraw',
      description: 'Request payout'
    }
  ];
}
