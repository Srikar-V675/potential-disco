// src/app/core/models/booking.model.ts

export type BookingStatus =
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  price: number;
  offerDiscount: number; // percentage
  convenienceFee: number;
  status: BookingStatus;
  schedule: number; // timestamp
  address: string;
  specialInstructions?: string;
  createdAt?: number;
  completedAt?: number;
  cancelledAt?: number;
}

export interface BookingCreate {
  userId: string;
  serviceId: string;
  price: number;
  offerDiscount: number;
  schedule: number;
  address: string;
}

export interface BookingWithDetails extends Booking {
  serviceName?: string;
  partnerName?: string;
  userName?: string;
  finalAmount: number; // price - discount + convenience fee
}
