// src/app/core/models/review.model.ts

export interface Review {
  id: string;
  userId: string;
  userName?: string;
  serviceId: string;
  partnerId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface ReviewCreate {
  userId: string;
  serviceId: string;
  partnerId: string;
  rating: number;
  comment: string;
  bookingId: string; // Can only review after booking
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
  total: number;
  average: number;
}
