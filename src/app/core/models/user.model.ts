// src/app/core/models/user.model.ts

export interface Address {
  // 'Home', 'Office', or empty string
  tag: string;
  street: string;
  city: string;
  state: string;
  pincode: number;
}

export interface BankAccount {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface User {
  id: string;
  userName: string;
  phoneNumber: number;
  role: 'partner' | 'user';
  email: string;
  bio?: string;
  addresses?: Address[];
  bankAccount?: BankAccount; // Only for partners, added later
  serviceAreas?: string[]; // Only for partners (array of pincodes)
  password?: string; // Only during registration, not stored in returned user
}

// DTO for registration
export interface RegisterDTO {
  userName: string;
  phoneNumber: number;
  role: 'partner' | 'user';
  email: string;
  password: string;
  bio?: string;
}

// DTO for login
export interface LoginDTO {
  email: string;
  password: string;
  // Optional role in login if you want to route differently post-login.
  // If you keep it out of DTO, we’ll infer from returned user.
  role?: 'partner' | 'user';
}

// Auth response from server
export interface AuthResponse {
  user: User;
  token: string; // We'll generate this as sessionId
}
