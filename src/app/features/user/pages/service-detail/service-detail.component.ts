import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../../../../core/services/services.service';
import { UserService } from '../../../../core/services/user.service';
import { ServiceEntity } from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss'
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private userService = inject(UserService);

  service: ServiceEntity | null = null;
  partner: User | null = null;
  loading = true;
  averageRating = 0;
  totalReviews = 0;
  ratingDistribution: RatingDistribution[] = [];

  ngOnInit() {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  loadService(serviceId: string) {
    this.loading = true;
    this.servicesService.getServiceById(serviceId).subscribe({
      next: (service) => {
        this.service = service;
        this.calculateRatings();
        this.loadPartner(service.partnerId);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading service:', err);
        this.loading = false;
      }
    });
  }

  loadPartner(partnerId: string) {
    this.userService.getUserById(partnerId).subscribe({
      next: (partner) => {
        this.partner = partner;
      },
      error: (err) => {
        console.error('Error loading partner:', err);
      }
    });
  }

  calculateRatings() {
    if (!this.service) return;

    this.averageRating = this.servicesService.calculateAverageRating(this.service.ratings);
    this.totalReviews = this.service.ratings.length;

    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = this.service!.ratings.filter(r => Math.floor(r.rating) === stars).length;
      const percentage = this.totalReviews > 0 ? (count / this.totalReviews) * 100 : 0;
      return { stars, count, percentage };
    });

    this.ratingDistribution = distribution;
  }

  goBack() {
    this.router.navigate(['/user/services']);
  }

  bookNow() {
    if (this.service) {
      this.router.navigate(['/user/booking', this.service.id]);
    }
  }

  getFinalPrice(): number {
    if (!this.service) return 0;
    return this.servicesService.calculateFinalPrice(this.service);
  }

  getOriginalPrice(): number {
    return this.service?.price || 0;
  }

  hasDiscount(): boolean {
    return this.service?.hasOffer && this.service.offerDiscount > 0 || false;
  }

  getSavingsAmount(): number {
    if (!this.service || !this.hasDiscount()) return 0;
    return this.getOriginalPrice() - this.getFinalPrice();
  }

  getSavingsPercentage(): number {
    return this.service?.offerDiscount || 0;
  }

  getDurationText(): string {
    if (!this.service) return '';

    if (this.service.priceType === 'daily') {
      return `${this.service.duration} days`;
    } else if (this.service.priceType === 'hourly') {
      const hours = Math.floor(this.service.duration / 60);
      const mins = this.service.duration % 60;
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

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  getServiceImage(): string {
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop';
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  getRandomHelpfulCount(): number {
    return Math.floor(Math.random() * 20) + 5;
  }
}
