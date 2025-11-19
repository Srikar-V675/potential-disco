// src/app/features/partner/components/booking-card/booking-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BookingStatus } from '../../../../core/models/booking.model';

export interface EnrichedBooking {
  id: string;
  userId: string;
  serviceId: string;
  userName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  phone: string | number;
  price: number;
  offerDiscount: number;
  convenienceFee: number;
  finalAmount: number;
  status: BookingStatus;
  schedule: number;
  specialInstructions?: string;
}

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './booking-card.component.html',
  styleUrls: ['./booking-card.component.scss']
})
export class BookingCardComponent {
  @Input() booking!: EnrichedBooking;
  @Output() statusChange = new EventEmitter<{
    id: string;
    newStatus: BookingStatus;
  }>();

  getStatusBadgeClass(status: BookingStatus): string {
    switch (status) {
      case 'confirmed':
        return 'badge-confirmed';
      case 'in-progress':
        return 'badge-in-progress';
      case 'completed':
        return 'badge-completed';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return '';
    }
  }

  onStatusChange(newStatus: BookingStatus): void {
    this.statusChange.emit({ id: this.booking.id, newStatus });
  }

  get canChangeStatus(): boolean {
    return (
      this.booking.status === 'confirmed' ||
      this.booking.status === 'in-progress'
    );
  }
}
