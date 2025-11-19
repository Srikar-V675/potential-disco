import { Routes } from '@angular/router';
import { UserLandingComponent } from './pages/user-landing/user-landing.component';
import { UserSignupComponent } from './pages/user-signup/user-signup.component';
import { UserLoginComponent } from './pages/user-login/user-login.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { ServiceListComponent } from './pages/service-list/service-list.component';
import { ServiceDetailComponent } from './pages/service-detail/service-detail.component';

export const USER_ROUTES: Routes = [
  { path: '', component: UserLandingComponent },
  { path: 'landing', component: UserLandingComponent },
  { path: 'signup', component: UserSignupComponent },
  { path: 'register', component: UserSignupComponent },
  { path: 'login', component: UserLoginComponent },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'services', component: ServiceListComponent },
  { path: 'service/:id', component: ServiceDetailComponent }
];
