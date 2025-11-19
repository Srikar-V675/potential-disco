// src/app/features/partner/pages/service-management/service-management.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter, switchMap, tap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import { ServicesService } from '../../../../core/services/services.service';
import {
  ServiceEntity,
  ServiceCreateDTO
} from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { ServiceFormDialogComponent } from '../../components/service-form-dialog/service-form-dialog.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    ServiceCardComponent,
    SidebarComponent
  ],
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.scss']
})
export class ServiceManagementComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly servicesService = inject(ServicesService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  currentUser$ = this.store.select(AuthSelectors.selectCurrentUser);

  services: ServiceEntity[] = [];
  isLoading = true;
  currentPartnerId = '';

  ngOnInit(): void {
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadServices(): void {
    this.currentUser$
      .pipe(
        filter((user): user is User => !!user && !!user.id),
        tap((user) => {
          console.log('📋 Loading services for partner:', user.id);
          this.currentPartnerId = user.id;
          this.isLoading = true;
        }),
        switchMap((user) =>
          this.servicesService.getServicesByPartnerId(user.id)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (services) => {
          console.log('✅ Services loaded:', services.length);
          this.services = services;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to load services:', error);
          this.isLoading = false;
        }
      });
  }

  openAddServiceDialog(): void {
    const dialogRef = this.dialog.open(ServiceFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        mode: 'create',
        partnerId: this.currentPartnerId
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.handleServiceCreate(result);
      }
    });
  }

  openEditServiceDialog(service: ServiceEntity): void {
    const dialogRef = this.dialog.open(ServiceFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        mode: 'edit',
        service: service,
        partnerId: this.currentPartnerId
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.handleServiceUpdate(service.id, result);
      }
    });
  }

  handleToggleActive(serviceId: string): void {
    const service = this.services.find((s) => s.id === serviceId);
    if (!service) return;

    const newStatus = !service.active;
    console.log(
      `🔄 Toggling service ${serviceId} to ${newStatus ? 'active' : 'inactive'}`
    );

    this.servicesService
      .toggleServiceActive(serviceId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedService) => {
          console.log('✅ Service status updated');
          const index = this.services.findIndex((s) => s.id === serviceId);
          if (index !== -1) {
            this.services[index] = updatedService;
          }
        },
        error: (error) => {
          console.error('❌ Failed to toggle service status:', error);
          alert('Failed to update service status. Please try again.');
        }
      });
  }

  handleServiceDelete(serviceId: string): void {
    console.log('🗑️ Deleting service:', serviceId);

    this.servicesService
      .deleteService(serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Service deleted');
          this.services = this.services.filter((s) => s.id !== serviceId);
        },
        error: (error) => {
          console.error('❌ Failed to delete service:', error);
          alert('Failed to delete service. Please try again.');
        }
      });
  }

  private handleServiceCreate(formData: any): void {
    const serviceData: ServiceCreateDTO = {
      partnerId: this.currentPartnerId,
      title: formData.title,
      description: formData.description || '',
      categoryId: formData.categoryId || 'default-category', // You might want to handle this differently
      priceType: formData.priceType,
      price: formData.price,
      duration: formData.duration,
      hasOffer: formData.hasOffer,
      offerTitle: formData.offerTitle || '',
      offerDiscount: formData.offerDiscount || 0,
      active: true,
      ratings: []
    };

    console.log('➕ Creating new service:', serviceData);

    this.servicesService
      .createService(serviceData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newService) => {
          console.log('✅ Service created:', newService);
          this.services = [...this.services, newService];
        },
        error: (error) => {
          console.error('❌ Failed to create service:', error);
          alert('Failed to create service. Please try again.');
        }
      });
  }

  private handleServiceUpdate(serviceId: string, formData: any): void {
    const updateData = {
      title: formData.title,
      description: formData.description || '',
      priceType: formData.priceType,
      price: formData.price,
      duration: formData.duration,
      hasOffer: formData.hasOffer,
      offerTitle: formData.offerTitle || '',
      offerDiscount: formData.offerDiscount || 0
    };

    console.log('📝 Updating service:', serviceId, updateData);

    this.servicesService
      .updateService(serviceId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedService) => {
          console.log('✅ Service updated:', updatedService);
          const index = this.services.findIndex((s) => s.id === serviceId);
          if (index !== -1) {
            this.services[index] = updatedService;
          }
        },
        error: (error) => {
          console.error('❌ Failed to update service:', error);
          alert('Failed to update service. Please try again.');
        }
      });
  }

  get activeServicesCount(): number {
    return this.services.filter((s) => s.active).length;
  }

  get inactiveServicesCount(): number {
    return this.services.filter((s) => !s.active).length;
  }
}
