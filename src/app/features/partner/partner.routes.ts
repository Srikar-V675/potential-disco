import { Routes } from '@angular/router';
import { PartnerLandingPageComponent } from './pages/partner-landing-page/partner-landing-page.component';
import { PartnerRegistrationContainerComponent } from './pages/partner-registration-container/partner-registration-container.component';
import { PartnerLoginComponent } from './pages/partner-login/partner-login.component';
import { PartnerDashboardComponent } from './pages/dashboard/dashboard.component';
import { partnerGuard } from '../../core/guards/partner.guard';
import { ServiceManagementComponent } from './pages/service-management/service-management.component';
import { PartnerBookingsComponent } from './pages/bookings/bookings.component';
import { EarningsComponent } from './pages/earnings/earnings.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';

export const PARTNER_ROUTES: Routes = [
  { path: 'landing', component: PartnerLandingPageComponent },
  { path: 'register', component: PartnerRegistrationContainerComponent },
  { path: 'login', component: PartnerLoginComponent },
  {
    path: 'dashboard',
    component: PartnerDashboardComponent,
    canActivate: [partnerGuard]
  },
  {
    path: 'services',
    component: ServiceManagementComponent,
    canActivate: [partnerGuard]
  },
  {
    path: 'bookings',
    component: PartnerBookingsComponent,
    canActivate: [partnerGuard]
  },
  {
    path: 'earnings',
    component: EarningsComponent,
    canActivate: [partnerGuard]
  },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [partnerGuard]
  }
];
