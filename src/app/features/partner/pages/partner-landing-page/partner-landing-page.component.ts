import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-partner-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    ButtonComponent,
    RouterLink
  ],
  templateUrl: './partner-landing-page.component.html',
  styleUrls: ['./partner-landing-page.component.scss']
})
export class PartnerLandingPageComponent implements OnInit {
  partnerImages = [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop'
  ];

  currentImageIndex = 0;

  ngOnInit() {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.partnerImages.length;
    }, 3000);
  }

  userTestimonials = [
    {
      text: 'Joining UrbanFix was the best decision for my business. I now have a steady stream of customers and earn 50% more than before.',
      author: 'Rajesh Kumar',
      rating: 5.0
    },
    {
      text: 'The platform is so easy to use. I can manage my bookings, set my availability, and get paid on time every week.',
      author: 'Priya Sharma',
      rating: 4.8
    },
    {
      text: 'I love the flexibility. I work when I want and the customer support team is always there to help if I need anything.',
      author: 'Amit Patel',
      rating: 5.0
    }
  ];
}
