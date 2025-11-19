# UrbanFix - Project Overview & Architecture

## What is This Project?

UrbanFix is a **home services marketplace** where:

- **Users** can book services (cleaning, plumbing, electrical, etc.)
- **Partners** (service providers) can manage their services, bookings, and earnings

Think of it like Uber, but for home services instead of rides.

---

## Project Structure - Why This Way?

```
src/app/
├── core/              # Shared across entire app (services, models, guards)
├── features/          # Feature modules (user, partner)
├── shared/            # Reusable UI components
└── store/             # NgRx state management
```

### Why This Structure?

**1. Core Folder** - "The Foundation"

- Contains things EVERY part of the app needs
- Services (API calls), Models (data types), Guards (route protection)
- **Why?** If both user and partner need to call the same API, we write it once here

**2. Features Folder** - "The Business Logic"

- Separated by user type (user vs partner)
- Each has its own pages, components, routes
- **Why?** User and Partner have completely different interfaces and needs

**3. Shared Folder** - "The Toolbox"

- Reusable components like buttons, forms
- **Why?** Don't repeat code - write once, use everywhere

**4. Store Folder** - "The Memory"

- NgRx state management for authentication
- **Why?** User login info needs to be accessible from anywhere in the app

---

## Technology Stack - What & Why?

### Angular 18

**What:** Frontend framework
**Why:**

- Component-based architecture (build UI like LEGO blocks)
- TypeScript support (catch errors before runtime)
- Powerful routing and dependency injection

### NgRx (Redux Pattern)

**What:** State management library
**Why:**

- Centralized state (one source of truth for user data)
- Predictable state changes (actions → reducers → new state)
- **Example:** When user logs in, we store their info in NgRx store. Any component can access it without passing data through multiple components.

### RxJS

**What:** Reactive programming library
**Why:**

- Handle async operations (API calls, user events)
- **Example:** When user types in search, we use `debounceTime(300)` to wait 300ms before searching (don't search on every keystroke)

### JSON Server

**What:** Mock REST API
**Why:**

- Quick backend for development
- Real HTTP requests without building actual backend
- **Example:** `GET /services` returns list of services from db.json

### SCSS

**What:** CSS preprocessor
**Why:**

- Variables, nesting, mixins
- **Example:** Define `$primary-color: #ff6b35` once, use everywhere

---

## Application Flow - The Big Picture

### User Journey:

```
Landing Page → Login/Signup → Dashboard → Browse Services →
Service Detail → Book Service → Confirmation
```

### Partner Journey:

```
Landing Page → Register → Dashboard → Manage Services →
View Bookings → Update Status → Check Earnings
```

---

## Key Architectural Decisions

### 1. Standalone Components (Angular 18)

**What:** Components don't need NgModule
**Why:** Simpler, more modular, better tree-shaking
**Example:**

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule], // Import what you need
})
```

### 2. Service Layer Pattern

**What:** All API calls go through services
**Why:**

- Separation of concerns (components don't know about HTTP)
- Reusability (multiple components use same service)
- Testability (mock services in tests)

**Example:**

```typescript
// ❌ BAD - Component making HTTP call directly
this.http.get('/services').subscribe(...)

// ✅ GOOD - Component using service
this.servicesService.getAllServices().subscribe(...)
```

### 3. Feature-Based Routing

**What:** Routes organized by feature
**Why:** Lazy loading, better organization

**Example:**

```typescript
// app.routes.ts
{ path: 'user', loadChildren: () => import('./features/user/user.routes') }
{ path: 'partner', loadChildren: () => import('./features/partner/partner.routes') }
```

### 4. Reactive Forms

**What:** Form controls managed programmatically
**Why:**

- Better validation
- Dynamic forms
- Type safety

**Example:**

```typescript
this.form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]]
});
```

---

## Data Flow - How Information Moves

### 1. User Logs In

```
LoginComponent
  → AuthService.login()
  → HTTP POST to /users
  → Store.dispatch(loginSuccess)
  → Auth State Updated
  → Router navigates to dashboard
```

### 2. User Books Service

```
ServiceDetailComponent
  → BookingService.createBooking()
  → HTTP POST to /bookings
  → Success response
  → Navigate to confirmation
```

### 3. Partner Views Bookings

```
BookingsComponent
  → BookingService.getBookingsByPartnerId()
  → HTTP GET /bookings?partnerId=xxx
  → Enrich with service & user data
  → Display in UI
```

---

## Why NgRx for Auth Only?

**Question:** Why use NgRx only for authentication and not for everything?

**Answer:**

1. **Authentication is Global** - Every component needs to know if user is logged in
2. **Persistent State** - User info needs to survive route changes
3. **Security** - Centralized place to manage auth token
4. **Simple Data** - Other data (services, bookings) is fetched when needed, not stored globally

**Example:**

```typescript
// Any component can check if user is logged in
this.store.select(selectIsAuthenticated).subscribe((isAuth) => {
  if (!isAuth) {
    this.router.navigate(['/login']);
  }
});
```

---

## Component Communication Patterns

### 1. Parent → Child (Input)

```typescript
// Parent
<app-booking-card [booking]="booking"></app-booking-card>

// Child
@Input() booking!: Booking;
```

### 2. Child → Parent (Output)

```typescript
// Child
@Output() statusChange = new EventEmitter<string>();
this.statusChange.emit('completed');

// Parent
<app-booking-card (statusChange)="onStatusChange($event)"></app-booking-card>
```

### 3. Unrelated Components (Service)

```typescript
// SearchService acts as messenger
// Header sets search query
this.searchService.setSearchQuery('plumbing');

// Dashboard listens for changes
this.searchService.searchQuery$.subscribe((query) => {
  this.performSearch(query);
});
```

---

## Error Handling Strategy

### 1. Service Level

```typescript
return this.http.get('/services').pipe(
  catchError((error) => {
    console.error('Error:', error);
    return throwError(() => new Error('Failed to load services'));
  })
);
```

### 2. Component Level

```typescript
this.servicesService.getAllServices().subscribe({
  next: (services) => (this.services = services),
  error: (err) => {
    console.error(err);
    this.showError = true;
  }
});
```

---

## Performance Optimizations

### 1. Lazy Loading

- Routes loaded only when accessed
- Reduces initial bundle size

### 2. OnPush Change Detection

- Component only checks for changes when inputs change
- Better performance for large lists

### 3. Debouncing

- Wait before executing (search, API calls)
- Reduces unnecessary operations

### 4. Unsubscribe Pattern

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Security Considerations

### 1. Route Guards

- Protect routes from unauthorized access
- Check authentication before allowing navigation

### 2. Input Validation

- Client-side validation (user experience)
- Server-side validation (security)

### 3. XSS Prevention

- Angular sanitizes by default
- Never use `innerHTML` with user input

---

## Next Steps for Production

1. **Real Backend** - Replace JSON Server with Node.js/Express
2. **Authentication** - JWT tokens, refresh tokens
3. **File Upload** - For portfolio images
4. **Payment Integration** - Razorpay/Stripe
5. **Real-time Updates** - WebSockets for booking status
6. **Testing** - Unit tests, E2E tests
7. **Deployment** - CI/CD pipeline, hosting

---

This document provides the 30,000-foot view. The following documents will dive deep into specific areas of the codebase.
