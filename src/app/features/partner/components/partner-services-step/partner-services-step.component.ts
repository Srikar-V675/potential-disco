import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PartnerRegistrationStore } from '../../../../store/partner-registration/partner-registration.store';
import {
  ServiceFormComponent,
  ServiceFormValue
} from '../service-form/service-form.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-partner-services-step',
  standalone: true,
  imports: [CommonModule, ServiceFormComponent, MatIconModule],
  templateUrl: './partner-services-step.component.html',
  styleUrls: ['./partner-services-step.component.scss']
})
export class PartnerServicesStepComponent implements OnInit, OnDestroy {
  selectedCategories: string[] = [];
  servicesByCategory: Record<string, ServiceFormValue[]> = {};
  categories: Category[] = [];
  private sub?: Subscription;

  constructor(
    private registrationStore: PartnerRegistrationStore,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Fetch categories
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });

    this.sub = this.registrationStore.state$.subscribe(() => {
      const snapshot = this.registrationStore.snapshot;
      this.selectedCategories = Array.isArray(snapshot.selectedCategoryIds)
        ? [...snapshot.selectedCategoryIds]
        : [];

      this.servicesByCategory = snapshot.servicesByCategory
        ? { ...snapshot.servicesByCategory }
        : {};

      this.selectedCategories.forEach((categoryId) => {
        if (!this.servicesByCategory[categoryId]) {
          this.servicesByCategory[categoryId] = [];
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onAddService(categoryId: string, service: ServiceFormValue): void {
    this.registrationStore.addServiceDraft(categoryId, service);
  }

  onRemoveService(categoryId: string, index: number): void {
    this.registrationStore.removeServiceDraft(categoryId, index);
  }

  // Helper method to get category by ID
  getCategoryById(categoryId: string): Category | undefined {
    return this.categories.find((cat) => cat.id === categoryId);
  }
}
