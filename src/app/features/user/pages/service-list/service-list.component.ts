import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicesService } from '../../../../core/services/services.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ServiceEntity } from '../../../../core/models/service.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-list.component.html',
  styleUrl: './service-list.component.scss'
})
export class ServiceListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);
  private categoryService = inject(CategoryService);

  services: ServiceEntity[] = [];
  filteredServices: ServiceEntity[] = [];
  categories: Category[] = [];

  searchQuery = '';
  showFilters = false;

  // Filter options
  priceRange = { min: 0, max: 2000 };
  selectedMinRating = 0;
  selectedCategories: string[] = [];
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'rating' = 'relevance';

  loading = true;

  ngOnInit() {
    // Load categories
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });

    // Check for category filter from query params
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategories = [params['category']];
      }
      this.loadServices();
    });
  }

  loadServices() {
    this.loading = true;
    this.servicesService.getActiveServices().subscribe({
      next: (services) => {
        this.services = services;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading services:', err);
        this.loading = false;
      }
    });
  }

  onSearchInput() {
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  closeFilters() {
    this.showFilters = false;
  }

  toggleCategory(categoryId: string) {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.applyFilters();
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  setMinRating(rating: number) {
    this.selectedMinRating = rating;
    this.applyFilters();
  }

  onPriceRangeChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.priceRange = { min: 0, max: 2000 };
    this.selectedMinRating = 0;
    this.selectedCategories = [];
    this.sortBy = 'relevance';
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.services];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(service =>
        this.selectedCategories.includes(service.categoryId)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(service => {
      const finalPrice = this.servicesService.calculateFinalPrice(service);
      return finalPrice >= this.priceRange.min && finalPrice <= this.priceRange.max;
    });

    // Apply rating filter
    if (this.selectedMinRating > 0) {
      filtered = filtered.filter(service => {
        const avgRating = this.servicesService.calculateAverageRating(service.ratings);
        return avgRating >= this.selectedMinRating;
      });
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'price-low':
        filtered = this.servicesService.sortByPrice(filtered, 'asc');
        break;
      case 'price-high':
        filtered = this.servicesService.sortByPrice(filtered, 'desc');
        break;
      case 'rating':
        filtered = this.servicesService.sortByRating(filtered);
        break;
      case 'relevance':
      default:
        // Keep original order
        break;
    }

    this.filteredServices = filtered;
  }

  viewService(serviceId: string) {
    this.router.navigate(['/user/service', serviceId]);
  }

  goBack() {
    this.router.navigate(['/user/dashboard']);
  }

  getServicePrice(service: ServiceEntity): number {
    return this.servicesService.calculateFinalPrice(service);
  }

  getOriginalPrice(service: ServiceEntity): number {
    return service.price;
  }

  hasDiscount(service: ServiceEntity): boolean {
    return service.hasOffer && service.offerDiscount > 0;
  }

  getServiceRating(service: ServiceEntity): number {
    return this.servicesService.calculateAverageRating(service.ratings);
  }

  getServiceImage(index: number): string {
    const images = [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop'
    ];
    return images[index % images.length];
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Service';
  }

  getDurationText(service: ServiceEntity): string {
    if (service.priceType === 'daily') {
      return `${service.duration} days`;
    } else if (service.priceType === 'hourly') {
      const hours = Math.floor(service.duration / 60);
      const mins = service.duration % 60;
      if (hours > 0 && mins > 0) {
        return `${hours}-${hours + 1} hours`;
      } else if (hours > 0) {
        return `${hours} hours`;
      } else {
        return `${mins} mins`;
      }
    }
    return '1 hour';
  }
}
