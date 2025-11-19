import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-landing.component.html',
  styleUrl: './user-landing.component.scss'
})
export class UserLandingComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoScrollInterval: any;

  slides = [
    {
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop',
      rating: 5,
      text: 'Great experienced plumbing service. Highly recommend!',
      author: 'John Doe'
    },
    {
      image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=600&fit=crop',
      rating: 5,
      text: 'Amazing cleaning service! My house looks brand new.',
      author: 'Sarah Smith'
    },
    {
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=600&fit=crop',
      rating: 5,
      text: 'Professional and reliable. Will use again!',
      author: 'Mike Johnson'
    }
  ];

  services = [
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Plumbing', icon: '🔧' },
    { name: 'Electrical', icon: '⚡' },
    { name: 'Painting', icon: '🎨' },
    { name: 'Carpentry', icon: '🔨' },
    { name: 'Appliances', icon: '❄️' }
  ];

  features = [
    {
      icon: 'verified',
      title: 'Verified Professionals',
      description: 'All service providers are background-verified'
    },
    {
      icon: 'payments',
      title: 'Best Pricing',
      description: 'Competitive prices with transparent quotes'
    },
    {
      icon: 'star',
      title: 'Quality Service',
      description: '30-day service warranty on all services'
    },
    {
      icon: 'schedule',
      title: 'Easy Booking',
      description: 'Book with seconds, reschedule anytime'
    }
  ];

  testimonials = [
    {
      rating: 5,
      text: 'Excellent service! The professional was punctual and did an amazing job with my plumbing issue.',
      author: 'Customer 1'
    },
    {
      rating: 5,
      text: 'Excellent service! The professional was punctual and did an amazing job with my plumbing issue.',
      author: 'Customer 2'
    },
    {
      rating: 5,
      text: 'Excellent service! The professional was punctual and did an amazing job with my plumbing issue.',
      author: 'Customer 3'
    }
  ];

  ngOnInit() {
    this.startAutoScroll();
  }

  ngOnDestroy() {
    this.stopAutoScroll();
  }

  startAutoScroll() {
    this.autoScrollInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.stopAutoScroll();
    this.startAutoScroll();
  }
}
