// src/app/core/models/earning.model.ts

export interface BankAccount {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface Earning {
  id: string;
  partnerId: string;
  earnings: number; // Total from completed bookings
  balance: number; // Wallet balance (can withdraw)
}

export interface Transaction {
  id: string;
  partnerId: string;
  bookingId?: string; // For earning transactions
  title: string; // Service name for earnings, "Payout to Bank" for payouts
  from: string; // User name for earnings, "Wallet" for payouts
  dateTime: number; // timestamp
  amount: number;
  type: 'earning' | 'payout';
  toBankAccount?: BankAccount; // Only for payouts
}

export interface EarningsSummary {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  completedBookings: number;
  thisMonthEarnings: number;
}

export interface PayoutRequest {
  partnerId: string;
  amount: number;
  bankAccount: BankAccount;
}
