# Complete Application Flows

## User Flow - From Landing to Booking

### Flow Diagram:

```
Landing Page → Login → Dashboard → Browse Services →
Service Detail → (Future: Booking) → Confirmation
```

---

## 1. User Lands on Website

### Component: `UserLandingComponent`

**What happens:**

1. User visits `http://localhost:4200/user`
2. Angular router loads `UserLandingComponent`
3. Component shows hero section, services, features

**Key Code:**

```typescript
export class UserLandingComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoScrollInterval: any;

  ngOnInit() {
    // Start auto-scrolling carousel
    this.autoScrollInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  ngOnDestroy() {
    // Clean up interval
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }
}
```

**Why setInterval?**

- Automatically change carousel slides
- Creates engaging UI
- Must clear in ngOnDestroy (prevent memory leak)

**Navigation Options:**

- Click "Login" → Goes to `/user/login`
- Click "Sign Up" → Goes to `/user/signup`

---

## 2. User Clicks Login

### Component: `UserLoginComponent`

**What happens:**

1. Router navigates to `/user/login`
2. Component creates reactive form
3. User fills email and password
4. User clicks "Login"
5. Form validation runs
6. If valid, dispatch login action
7. NgRx effect makes API call
8. On success, navigate to dashboard

**Step-by-step Code:**

**Step 1: Create Form**

```typescript
ngOnInit() {
  this.form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });
}
```

**Why FormBuilder?**

- Cleaner syntax than `new FormControl()`
- Built-in validation
- Type-safe

**Step 2: Handle Submit**

```typescript
onSubmit() {
  // Check if form is valid
  if (!this.form.valid) {
    // Mark all fields as touched (show errors)
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
    return;
  }

  // Get form values
  const { email, password } = this.form.value;

  // Call auth service
  this.authService.login({ email, password, role: 'user' }).subscribe({
    next: (response) => {
      // Dispatch to NgRx store
      this.store.dispatch(AuthActions.loginSuccess({
        user: response.user,
        token: response.token
      }));

      // Navigate to dashboard
      this.router.navigate(['/user/dashboard']);
    },
    error: (err) => {
      alert(err.message || 'Login failed');
    }
  });
}
```

**Why mark as touched?**

- Shows validation errors
- User sees what's wrong
- Better UX

**Flow:**

```
Form Submit → Validate → Auth Service → API Call →
Success → Store Update → Navigate → Dashboard
```

---

## 3. User Sees Dashboard

### Component: `UserDashboardComponent`

**What happens:**

1. Component loads
2. Gets current user from NgRx store
3. Loads recent bookings
4. Loads recommended services
5. Loads categories
6. Sets up search listener

**Initialization Flow:**

```typescript
ngOnInit() {
  // 1. Get current user
  this.store.select(AuthSelectors.selectCurrentUser)
    .pipe(
      filter((user): user is User => !!user && !!user.id),
      takeUntil(this.destroy$)
    )
    .subscribe(user => {
      this.currentUser = user;
      this.loadDashboardData();  // Load user-specific data
    });

  // 2. Listen for search from header
  this.searchService.searchQuery$
    .pipe(takeUntil(this.destroy$))
    .subscribe(query => {
      if (query.trim()) {
        this.performSearch(query);
      }
    });

  // 3. Load categories
  this.loadCategories();
}
```

**Why this order?**

1. User first (need user ID for bookings)
2. Search listener (header might search anytime)
3. Categories (independent of user)

**Load Dashboard Data:**

```typescript
loadDashboardData() {
  if (!this.currentUser) return;

  // Load recent bookings
  this.bookingService.getBookingsByUserId(this.currentUser.id)
    .subscribe({
      next: (bookings) => {
        this.recentBookings = bookings
          .sort((a, b) => dateB - dateA)  // Newest first
          .slice(0, 3);  // Only 3
      }
    });

  // Load recommended services
  this.servicesService.getActiveServices()
    .subscribe({
      next: (services) => {
        this.recommendedServices = services.slice(0, 4);
      }
    });
}
```

**Why separate API calls?**

- Bookings and services are independent
- Can load in parallel
- One fails, other still works

**Dashboard Features:**

1. **Search in Header**

   - User types in search bar
   - Header calls `searchService.setSearchQuery(query)`
   - Dashboard receives via `searchService.searchQuery$`
   - Dashboard performs search
   - Results show in dropdown

2. **Quick Actions**

   - Browse Services → `/user/services`
   - My Bookings → `/user/bookings`
   - Support → Opens chat

3. **Recent Bookings**

   - Shows last 3 bookings
   - "View All" → `/user/bookings`
   - Only shows if user has bookings

4. **Recommended Services**

   - Shows 4 services
   - Click → `/user/service/:id`

5. **Popular Categories**

   - Click → `/user/services?category=:id`

6. **Live Chat**
   - Floating button
   - Click → Opens chat window
   - Type message → Get static response

---

## 4. User Browses Services

### Component: `ServiceListComponent`

**What happens:**

1. User clicks "Browse Services" or category
2. Router navigates to `/user/services`
3. Component loads all active services
4. User can search, filter, sort

**Initialization:**

```typescript
ngOnInit() {
  // Load categories for filters
  this.categoryService.getCategories().subscribe({
    next: (categories) => {
      this.categories = categories;
    }
  });

  // Check for category filter from URL
  this.route.queryParams.subscribe(params => {
    if (params['category']) {
      this.selectedCategories = [params['category']];
    }
    this.loadServices();
  });
}
```

**Why check query params?**

- User might come from category click
- URL: `/user/services?category=cat-001`
- Pre-select that category

**Load and Filter:**

```typescript
loadServices() {
  this.servicesService.getActiveServices().subscribe({
    next: (services) => {
      this.services = services;
      this.applyFilters();  // Apply any active filters
    }
  });
}

applyFilters() {
  let filtered = [...this.services];

  // 1. Search filter
  if (this.searchQuery.trim()) {
    filtered = filtered.filter(service =>
      service.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // 2. Category filter
  if (this.selectedCategories.length > 0) {
    filtered = filtered.filter(service =>
      this.selectedCategories.includes(service.categoryId)
    );
  }

  // 3. Price range filter
  filtered = filtered.filter(service => {
    const price = this.servicesService.calculateFinalPrice(service);
    return price >= this.priceRange.min && price <= this.priceRange.max;
  });

  // 4. Rating filter
  if (this.selectedMinRating > 0) {
    filtered = filtered.filter(service => {
      const rating = this.servicesService.calculateAverageRating(service.ratings);
      return rating >= this.selectedMinRating;
    });
  }

  // 5. Sort
  switch (this.sortBy) {
    case 'price-low':
      filtered = this.servicesService.sortByPrice(filtered, 'asc');
      break;
    case 'price-high':
      filtered = this.servicesService.sortByPrice(filtered, 'desc');
      break;
    case 'rating':
      filtered = this.servicesService.sortByRating(filtered);
      break;
  }

  this.filteredServices = filtered;
}
```

**Why client-side filtering?**

- JSON Server has limited filtering
- More control over logic
- Can combine multiple filters
- Instant results (no API call)

**Filter Panel:**

- Click "Filters" button → Shows panel
- Price range sliders
- Rating radio buttons
- Category checkboxes
- "Clear All" button

**Each filter change:**

```typescript
toggleCategory(categoryId: string) {
  // Add or remove from selected
  const index = this.selectedCategories.indexOf(categoryId);
  if (index > -1) {
    this.selectedCategories.splice(index, 1);
  } else {
    this.selectedCategories.push(categoryId);
  }

  // Re-apply all filters
  this.applyFilters();
}
```

---

## 5. User Views Service Detail

### Component: `ServiceDetailComponent`

**What happens:**

1. User clicks service card
2. Router navigates to `/user/service/:id`
3. Component gets ID from route
4. Loads service details
5. Loads partner info
6. Calculates ratings

**Get Service ID:**

```typescript
ngOnInit() {
  const serviceId = this.route.snapshot.paramMap.get('id');
  if (serviceId) {
    this.loadService(serviceId);
  }
}
```

**Why snapshot?**

- One-time read
- Component recreated on navigation
- Simpler than Observable

**Load Service:**

```typescript
loadService(serviceId: string) {
  this.loading = true;

  this.servicesService.getServiceById(serviceId).subscribe({
    next: (service) => {
      this.service = service;
      this.calculateRatings();  // Process reviews
      this.loadPartner(service.partnerId);  // Get partner info
      this.loading = false;
    },
    error: (err) => {
      console.error('Error:', err);
      this.loading = false;
    }
  });
}
```

**Calculate Ratings:**

```typescript
calculateRatings() {
  if (!this.service) return;

  // Average rating
  this.averageRating = this.servicesService
    .calculateAverageRating(this.service.ratings);

  // Total reviews
  this.totalReviews = this.service.ratings.length;

  // Rating distribution (5★, 4★, 3★, 2★, 1★)
  this.ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = this.service!.ratings
      .filter(r => Math.floor(r.rating) === stars).length;
    const percentage = this.totalReviews > 0
      ? (count / this.totalReviews) * 100
      : 0;
    return { stars, count, percentage };
  });
}
```

**Why calculate distribution?**

- Show rating bars (like Amazon)
- User sees rating breakdown
- More informative than just average

**Page Sections:**

1. **Service Image**

   - Large hero image
   - Discount badge if offer
   - Category badge

2. **Service Info**

   - Title
   - Rating and review count
   - Duration

3. **About Section**

   - Description
   - What's included (checklist)
   - Service features

4. **Reviews Section**

   - Overall rating score
   - Rating distribution bars
   - Individual reviews with:
     - User avatar
     - Rating stars
     - Comment
     - Date
     - Helpful count

5. **Booking Card (Sticky)**
   - Original price (if discount)
   - Final price
   - Savings amount
   - "Book Now" button
   - Features (secure payment, etc.)

**Book Now:**

```typescript
bookNow() {
  if (this.service) {
    this.router.navigate(['/user/booking', this.service.id]);
  }
}
```

---

## Partner Flow - From Registration to Earnings

### Flow Diagram:

```
Landing Page → Register → Dashboard → Add Services →
Manage Bookings → Update Status → View Earnings
```

---

## 1. Partner Registers

### Component: `PartnerRegistrationContainerComponent`

**Multi-step Registration:**

**Step 1: Basic Info**

```typescript
// Form for step 1
this.basicInfoForm = this.fb.group({
  userName: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phoneNumber: ['', Validators.required],
  password: ['', [Validators.required, Validators.minLength(8)]]
});
```

**Step 2: Business Info**

```typescript
this.businessInfoForm = this.fb.group({
  bio: ['', Validators.required],
  serviceAreas: this.fb.array([]) // Dynamic array
});
```

**Why FormArray?**

- Dynamic number of service areas
- Can add/remove
- Each area is a FormControl

**Step 3: Bank Details**

```typescript
this.bankDetailsForm = this.fb.group({
  accountHolder: ['', Validators.required],
  accountNumber: ['', Validators.required],
  ifsc: ['', Validators.required],
  bankName: ['', Validators.required]
});
```

**Navigation Between Steps:**

```typescript
nextStep() {
  if (this.currentStep === 1 && this.basicInfoForm.valid) {
    this.currentStep = 2;
  } else if (this.currentStep === 2 && this.businessInfoForm.valid) {
    this.currentStep = 3;
  }
}

previousStep() {
  if (this.currentStep > 1) {
    this.currentStep--;
  }
}
```

**Final Submit:**

```typescript
onSubmit() {
  // Combine all form data
  const userData = {
    ...this.basicInfoForm.value,
    ...this.businessInfoForm.value,
    bankAccount: this.bankDetailsForm.value,
    role: 'partner'
  };

  // Register
  this.authService.register(userData).subscribe({
    next: (response) => {
      this.store.dispatch(AuthActions.registerSuccess({
        user: response.user,
        token: response.token
      }));
      this.router.navigate(['/partner/dashboard']);
    },
    error: (err) => {
      alert(err.message);
    }
  });
}
```

---

## 2. Partner Dashboard

### Component: `PartnerDashboardComponent`

**What loads:**

1. Profile completion status
2. Recent bookings
3. Earnings summary
4. Quick actions

**Profile Completion:**

```typescript
// profile-completion.component.ts
calculateCompletion(partnerId: string) {
  forkJoin({
    portfolio: this.portfolioService.getPortfolioByPartnerId(partnerId),
    services: this.servicesService.getServicesByPartnerId(partnerId),
    earnings: this.earningsService.getPartnerEarnings(partnerId)
  }).subscribe(({ portfolio, services, earnings }) => {
    // Update completion steps
    this.completionSteps[1].completed = services.length > 0;
    this.completionSteps[2].completed = portfolio.length > 0;
    this.completionSteps[3].completed = !!earnings.id;

    // Calculate percentage
    const completed = this.completionSteps.filter(s => s.completed).length;
    this.completionPercentage = (completed / this.completionSteps.length) * 100;
  });
}
```

**Why forkJoin?**

- Make 3 API calls in parallel
- Wait for all to complete
- Combine results
- More efficient than sequential

---

## 3. Partner Manages Bookings

### Component: `PartnerBookingsComponent`

**Load Bookings:**

```typescript
loadBookings() {
  this.currentUser$.pipe(
    filter((user): user is User => !!user && !!user.id),
    switchMap((user) => {
      return forkJoin({
        bookings: this.bookingService.getBookingsByPartnerId(user.id),
        services: this.servicesService.getAllServices(),
        users: this.userService.getAllUsers()
      });
    })
  ).subscribe(({ bookings, services, users }) => {
    this.bookings = bookings;
    this.services = services;
    this.users = users;

    // Enrich bookings with service and user details
    this.enrichedBookings = this.enrichBookingsWithDetails(bookings);
    this.applyFilters();
  });
}
```

**Why enrich bookings?**

- Booking only has IDs (serviceId, userId)
- Need service name, user name for display
- Join data from multiple sources

**Enrich Process:**

```typescript
enrichBookingsWithDetails(bookings: Booking[]): EnrichedBooking[] {
  return bookings.map((booking) => {
    // Find service
    const service = this.services.find(s => s.id === booking.serviceId);

    // Find user
    const user = this.users.find(u => u.id === booking.userId);

    // Calculate final amount
    const discount = booking.price * (booking.offerDiscount / 100);
    const finalAmount = booking.price - discount + booking.convenienceFee;

    return {
      ...booking,
      serviceName: service?.title || 'Unknown',
      userName: user?.userName || 'Unknown',
      phone: user?.phoneNumber || 'N/A',
      date: this.formatDate(booking.schedule),
      time: this.formatTime(booking.schedule),
      finalAmount
    };
  });
}
```

**Filter Bookings:**

```typescript
applyFilters() {
  let filtered = [...this.enrichedBookings];

  // Search filter
  if (this.searchQuery.trim()) {
    filtered = filtered.filter(booking =>
      booking.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Status filter
  switch (this.selectedFilter) {
    case 'pending':
      // Today and tomorrow
      filtered = filtered.filter(b =>
        new Date(b.schedule) <= tomorrow && b.status === 'confirmed'
      );
      break;
    case 'upcoming':
      // After tomorrow
      filtered = filtered.filter(b =>
        new Date(b.schedule) > tomorrow && b.status === 'confirmed'
      );
      break;
    case 'completed':
      filtered = filtered.filter(b => b.status === 'completed');
      break;
  }

  this.filteredBookings = filtered;
}
```

**Update Status:**

```typescript
onStatusChange(event: { id: string; newStatus: BookingStatus }) {
  this.bookingService.updateBookingStatus(event.id, event.newStatus)
    .pipe(
      switchMap((updatedBooking) => {
        // If completed, process payment
        if (event.newStatus === 'completed') {
          const booking = this.enrichedBookings.find(b => b.id === event.id);

          return this.earningsService.processBookingCompletion(
            updatedBooking,
            this.currentPartnerId,
            booking.serviceName,
            booking.userName
          );
        }
        return of(updatedBooking);
      })
    )
    .subscribe({
      next: () => {
        // Update local state
        this.applyFilters();
      }
    });
}
```

**Why switchMap?**

- First update booking status
- Then process payment if completed
- Chain async operations
- Return final result

---

## 4. Partner Views Earnings

### Component: `EarningsComponent`

**Load Earnings:**

```typescript
loadEarnings() {
  this.currentUser$.pipe(
    filter((user): user is User => !!user && !!user.id),
    switchMap((user) => {
      return forkJoin({
        earnings: this.earningsService.getPartnerEarnings(user.id),
        transactions: this.earningsService.getTransactionHistory(user.id)
      });
    })
  ).subscribe(({ earnings, transactions }) => {
    this.earnings = earnings;
    this.transactions = transactions;
    this.calculateStats();
  });
}
```

**Calculate Stats:**

```typescript
calculateStats() {
  const thisMonth = new Date().getMonth();

  // This month's earnings
  this.thisMonthEarnings = this.transactions
    .filter(t => {
      const date = new Date(t.dateTime);
      return date.getMonth() === thisMonth && t.type === 'earning';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending payouts
  this.pendingPayouts = this.transactions
    .filter(t => t.type === 'payout' && !t.toBankAccount)
    .length;
}
```

**Request Payout:**

```typescript
requestPayout() {
  const amount = this.payoutForm.value.amount;

  this.earningsService.requestPayout({
    partnerId: this.currentPartnerId,
    amount,
    bankAccount: this.partner.bankAccount
  }).subscribe({
    next: (transaction) => {
      alert('Payout requested successfully!');
      this.loadEarnings();  // Refresh data
    },
    error: (err) => {
      alert(err.message);
    }
  });
}
```

---

## Key Interactions

### 1. Search Flow

```
User types in header
  ↓
Header: searchService.setSearchQuery(query)
  ↓
Dashboard: searchService.searchQuery$.subscribe()
  ↓
Dashboard: performSearch(query)
  ↓
Dashboard: servicesService.filterServices({ searchQuery: query })
  ↓
Dashboard: Display results
```

### 2. Booking Status Update Flow

```
Partner clicks "Complete"
  ↓
BookingCard: statusChange.emit('completed')
  ↓
BookingsComponent: onStatusChange()
  ↓
BookingService: updateBookingStatus()
  ↓
API: PATCH /bookings/:id
  ↓
EarningsService: processBookingCompletion()
  ↓
API: POST /transactions
  ↓
API: PATCH /earnings/:id
  ↓
Component: Refresh data
```

### 3. Authentication Flow

```
User submits login form
  ↓
Component: authService.login()
  ↓
Service: HTTP POST /users
  ↓
Service: Return user + token
  ↓
Component: store.dispatch(loginSuccess())
  ↓
Effect: Save to localStorage
  ↓
Effect: Navigate to dashboard
  ↓
Reducer: Update state
  ↓
All components: Get updated state
```

---

## Data Flow Summary

### Read Operations:

```
Component → Service → HTTP GET → API →
Response → Service → Component → Template
```

### Write Operations:

```
Component → Service → HTTP POST/PATCH → API →
Response → Service → Component → Update UI
```

### State Management:

```
Component → Action → Effect → API →
Response → Action → Reducer → State →
Selector → Component → Template
```

---

This completes the comprehensive documentation of your UrbanFix application!
