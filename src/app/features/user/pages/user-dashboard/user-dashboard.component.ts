import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { User } from '../../../../core/models/user.model';
import { Booking } from '../../../../core/models/booking.model';
import { ServiceEntity } from '../../../../core/models/service.model';
import { Category } from '../../../../core/models/category.model';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';
import { SearchService } from '../../../../core/services/search.service';
import { ServicesService } from '../../../../core/services/services.service';
import { BookingService } from '../../../../core/services/booking.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private searchService = inject(SearchService);
  private servicesService = inject(ServicesService);
  private bookingService = inject(BookingService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  searchResults: ServiceEntity[] = [];
  showSearchResults = false;
  recentBookings: Booking[] = [];
  recommendedServices: ServiceEntity[] = [];
  categories: Category[] = [];
  showChat = false;
  chatMessages: { text: string; isUser: boolean; timestamp: Date }[] = [];
  newMessage = '';

  ngOnInit() {
    this.store.select(AuthSelectors.selectCurrentUser).pipe(
      filter((user): user is User => !!user && !!user.id),
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      this.loadDashboardData();
    });

    // Subscribe to search queries from header
    this.searchService.searchQuery$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.trim()) {
        this.performSearch(query);
      } else {
        this.searchResults = [];
        this.showSearchResults = false;
      }
    });

    // Subscribe to show results flag
    this.searchService.showResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(show => {
      this.showSearchResults = show;
    });

    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchService.clearSearch();
  }

  loadDashboardData() {
    if (!this.currentUser) return;

    // Load recent bookings using BookingService
    this.bookingService.getBookingsByUserId(this.currentUser.id).subscribe({
      next: (bookings) => {
        this.recentBookings = bookings
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
      }
    });

    // Load recommended services using ServicesService
    this.servicesService.getActiveServices().subscribe({
      next: (services) => {
        this.recommendedServices = services.slice(0, 4);
      },
      error: (err) => {
        console.error('Error loading services:', err);
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  performSearch(query: string) {
    if (!query.trim()) return;

    console.log('Performing search for:', query);

    // Use ServicesService to filter services
    this.servicesService.filterServices({
      active: true,
      searchQuery: query
    }).subscribe({
      next: (services) => {
        console.log('All services:', services);
        const results = services.slice(0, 5);

        console.log('Filtered search results:', results);
        this.searchResults = results;

        // Update search service with results
        this.searchService.setSearchResults(results.map(s => ({
          id: s.id,
          title: s.title,
          price: s.price,
          hasOffer: s.hasOffer,
          offerDiscount: s.offerDiscount
        })));
      },
      error: (err) => {
        console.error('Error fetching services:', err);
      }
    });
  }

  selectSearchResult(service: ServiceEntity) {
    this.router.navigate(['/user/service', service.id]);
    this.searchService.clearSearch();
  }

  browseServices() {
    this.router.navigate(['/user/services']);
  }

  viewAllBookings() {
    this.router.navigate(['/user/bookings']);
  }

  viewService(serviceId: string) {
    this.router.navigate(['/user/service', serviceId]);
  }

  viewCategory(categoryId: string) {
    this.router.navigate(['/user/services'], { queryParams: { category: categoryId } });
  }

  goToProfile() {
    this.router.navigate(['/user/profile']);
  }

  toggleChat() {
    this.showChat = !this.showChat;
    if (this.showChat && this.chatMessages.length === 0) {
      this.chatMessages.push({
        text: 'Hello! How can I help you today?',
        isUser: false,
        timestamp: new Date()
      });
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // Add user message
    this.chatMessages.push({
      text: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });

    this.newMessage = '';

    // Add bot response after delay
    setTimeout(() => {
      this.chatMessages.push({
        text: 'Thank you for your message. Our support team will assist you shortly!',
        isUser: false,
        timestamp: new Date()
      });
    }, 1000);
  }

  closeChat() {
    this.showChat = false;
  }

  getServicePrice(service: ServiceEntity): string {
    const finalPrice = this.servicesService.calculateFinalPrice(service);
    return `₹${finalPrice}`;
  }

  getBookingStatus(booking: Booking): string {
    return booking.status || 'pending';
  }

  getServiceImage(index: number): string {
    const images = [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', // AC/Electrical
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=300&fit=crop', // Kitchen/Cleaning
      'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=400&h=300&fit=crop', // Plumbing
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop'  // Painting/Carpentry
    ];
    return images[index % images.length];
  }
}
