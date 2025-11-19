// src/app/core/models/service.model.ts

export type PriceType = 'hourly' | 'daily';

export interface ServiceRating {
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
}

export interface ServiceEntity {
  id: string;
  partnerId: string;
  title: string;
  description?: string;
  categoryId: string;
  priceType: PriceType;
  price: number;
  duration: number; // minutes or days depending on priceType context
  hasOffer: boolean;
  offerTitle: string;
  offerDiscount: number; // percentage 0-100
  active: boolean;
  ratings: ServiceRating[];
}

/**
 * DTO for creating a service (POST /services)
 * The server (JSON Server) will assign an id if configured; otherwise we can provide one.
 */
export interface ServiceCreateDTO {
  partnerId: string;
  title: string;
  description?: string;
  categoryId: string;
  priceType: PriceType;
  price: number;
  duration: number;
  hasOffer: boolean;
  offerTitle: string;
  offerDiscount: number;
  active: boolean;
  ratings?: ServiceRating[]; // optional on creation, defaults to []
}

// ============= EXTENDED MODELS =============

/**
 * Filter criteria for searching/filtering services
 */
export interface ServiceFilter {
  categoryId?: string;
  partnerId?: string;
  priceMin?: number;
  priceMax?: number;
  hasOffer?: boolean;
  active?: boolean;
  minRating?: number;
  searchQuery?: string;
  priceType?: PriceType;
}

/**
 * Service entity enriched with calculated fields
 */
export interface ServiceWithCalculatedPrice extends ServiceEntity {
  finalPrice: number; // After offer discount
  averageRating: number;
  totalReviews: number;
}

/**
 * DTO for updating a service (PATCH /services/:id)
 */
export interface ServiceUpdateDTO {
  title?: string;
  description?: string;
  categoryId?: string;
  priceType?: PriceType;
  price?: number;
  duration?: number;
  hasOffer?: boolean;
  offerTitle?: string;
  offerDiscount?: number;
  active?: boolean;
}
