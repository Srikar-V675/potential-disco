import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, switchMap, catchError, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { PartnerBasicInfoStepComponent } from '../../components/partner-basic-info-step/partner-basic-info-step.component';
import { PartnerCategoryStepComponent } from '../../components/partner-category-step/partner-category-step.component';
import { PartnerServicesStepComponent } from '../../components/partner-services-step/partner-services-step.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ServicesService } from '../../../../core/services/services.service';
import { PartnerRegistrationStore } from '../../../../store/partner-registration/partner-registration.store';
import { RegisterDTO } from '../../../../core/models/user.model';
import { ServiceCreateDTO } from '../../../../core/models/service.model';

@Component({
  selector: 'app-partner-registration-container',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    PartnerBasicInfoStepComponent,
    PartnerCategoryStepComponent,
    PartnerServicesStepComponent
  ],
  providers: [PartnerRegistrationStore],
  templateUrl: './partner-registration-container.component.html',
  styleUrls: ['./partner-registration-container.component.scss']
})
export class PartnerRegistrationContainerComponent {
  private authService = inject(AuthService);
  private serviceService = inject(ServicesService);
  private router = inject(Router);

  readonly totalSteps = 3;
  isSubmitting = false;

  constructor(public store: PartnerRegistrationStore) { }

  getCompletionPercentage(): number {
    return Math.round((this.store.snapshot.currentStep / this.totalSteps) * 100);
  }

  onNext(): void {
    const currentStep = this.store.snapshot.currentStep;

    if (currentStep === 1 && !this.store.canProceedFromStep1()) {
      alert('Please complete all required fields');
      return;
    }

    if (currentStep === 2 && !this.store.canProceedFromStep2()) {
      alert('Please select at least one category');
      return;
    }

    this.store.nextStep();
  }

  onPrevious(): void {
    this.store.prevStep();
  }

  onSubmit(): void {
    if (!this.store.canProceedFromStep3()) {
      alert('Please complete all required services');
      return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const snapshot = this.store.snapshot;

    // Step 1: Transform and register user
    const registerDTO: RegisterDTO = {
      userName: snapshot.basicInfo!.userName,
      email: snapshot.basicInfo!.email,
      phoneNumber: Number(snapshot.basicInfo!.phoneNumber),
      password: snapshot.basicInfo!.password,
      role: 'partner',
      bio: '' // Optional, can add bio field to form later
    };

    this.authService
      .register(registerDTO)
      .pipe(
        switchMap((authResponse) => {
          const partnerId = authResponse.user.id;
          console.log('Partner registered:', authResponse);

          // Step 2: Collect all services and create them
          const serviceCreationRequests = this.collectServiceCreationRequests(
            partnerId,
            snapshot.servicesByCategory
          );

          if (serviceCreationRequests.length === 0) {
            return of([]); // No services to create
          }

          // Create all services in parallel
          return forkJoin(serviceCreationRequests);
        }),
        catchError((error) => {
          console.error('Registration error:', error);
          alert(error.message || 'Registration failed. Please try again.');
          this.isSubmitting = false;
          return of(null);
        })
      )
      .subscribe((services) => {
        if (services !== null) {
          console.log('All services created:', services);

          // Clear the store
          this.store.reset();

          // Redirect to partner dashboard
          this.router.navigate(['/partner/dashboard']);
        }
        this.isSubmitting = false;
      });
  }

  private collectServiceCreationRequests(
    partnerId: string,
    servicesByCategory: Record<string, any[]>
  ): any[] {
    const requests: any[] = [];

    Object.entries(servicesByCategory).forEach(([categoryId, services]) => {
      services.forEach((service) => {
        const serviceDTO: ServiceCreateDTO = {
          partnerId,
          title: service.title,
          description: service.description || '',
          categoryId,
          priceType: service.priceType,
          price: service.price,
          duration: service.duration,
          hasOffer: service.hasOffer,
          offerTitle: service.offerTitle || '',
          offerDiscount: service.offerDiscount || 0,
          active: true,
          ratings: []
        };

        requests.push(this.serviceService.createService(serviceDTO));
      });
    });

    return requests;
  }
}
