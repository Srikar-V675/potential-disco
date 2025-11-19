import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/user', pathMatch: 'full' },

  // Lazy load partner routes
  {
    path: 'partner',
    loadChildren: () =>
      import('./features/partner/partner.routes').then((m) => m.PARTNER_ROUTES)
  },

  // Lazy load user routes
  {
    path: 'user',
    loadChildren: () =>
      import('./features/user/user.routes').then((m) => m.USER_ROUTES)
  },

  { path: '**', redirectTo: '/user' }
];
