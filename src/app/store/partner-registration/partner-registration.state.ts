// src/app/features/partner-registration/state/partner-registration.state.ts

export type PriceType = 'hourly' | 'daily';

export interface BasicInfoState {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface ServiceDraft {
  // Minimal shape needed during the wizard (pre-POST)
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  duration: number; // minutes or days depending on priceType
  hasOffer: boolean;
  offerTitle: string;
  offerDiscount: number; // 0-100
}

export interface PartnerRegistrationState {
  currentStep: number; // 1..3
  basicInfo: BasicInfoState | null;
  selectedCategoryIds: string[]; // must contain at least one
  servicesByCategory: Record<string, ServiceDraft[]>; // categoryId -> drafts (>=1)
}
