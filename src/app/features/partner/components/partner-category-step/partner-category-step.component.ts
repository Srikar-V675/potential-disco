import { Component, OnInit } from '@angular/core';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { PartnerRegistrationStore } from '../../../../store/partner-registration/partner-registration.store';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-partner-category-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './partner-category-step.component.html',
  styleUrls: ['./partner-category-step.component.scss']
})
export class PartnerCategoryStepComponent implements OnInit {
  categories: Category[] = [];
  selectedCategoryIds: Set<string> = new Set();

  constructor(
    private categoryService: CategoryService,
    private registrationStore: PartnerRegistrationStore
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
      const initial = this.registrationStore.snapshot.selectedCategoryIds;
      this.selectedCategoryIds = new Set(initial);
    });
  }

  toggleCategory(categoryId: string): void {
    if (this.selectedCategoryIds.has(categoryId)) {
      this.selectedCategoryIds.delete(categoryId);
    } else {
      this.selectedCategoryIds.add(categoryId);
    }
    this.registrationStore.setSelectedCategories(
      Array.from(this.selectedCategoryIds)
    );
  }
}
