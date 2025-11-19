// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
  label: string;
  route: string;
  icon?: string;
  key: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() activePage: string = 'dashboard';

  menuItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      route: '/partner/dashboard',
      key: 'dashboard',
      icon: 'dashboard'
    },
    { label: 'Profile', route: '/partner/profile', key: 'profile', icon: 'person' },
    {
      label: 'Manage Services',
      route: '/partner/services',
      key: 'services',
      icon: 'build'
    },
    {
      label: 'Portfolio',
      route: '/partner/portfolio',
      key: 'portfolio',
      icon: 'folder'
    },
    {
      label: 'My Bookings',
      route: '/partner/bookings',
      key: 'bookings',
      icon: 'event'
    },
    {
      label: 'Earnings',
      route: '/partner/earnings',
      key: 'earnings',
      icon: 'account_balance_wallet'
    },
    { label: 'Reviews', route: '/partner/reviews', key: 'reviews', icon: 'star' },
    {
      label: 'Notifications',
      route: '/partner/notifications',
      key: 'notifications',
      icon: 'notifications'
    },
    { label: 'Support', route: '/partner/support', key: 'support', icon: 'help' }
  ];
}
