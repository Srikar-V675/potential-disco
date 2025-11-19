# Services and API Layer - Deep Dive

## What is a Service in Angular?

A service is a **class that handles business logic and data operations**. Think of it as a **middleman** between your components and the backend API.

**Why use services?**

- **Separation of Concerns:** Components focus on UI, services handle data
- **Reusability:** Multiple components can use the same service
- **Testability:** Easy to mock services in tests
- **Maintainability:** Change API logic in one place

---

## Service Structure

```
core/services/
├── auth.service.ts          # Authentication (login, register)
├── services.service.ts      # Service CRUD operations
├── booking.service.ts       # Booking management
├── user.service.ts          # User profile operations
├── category.service.ts      # Categories
├── portfolio.service.ts     # Partner portfolio
├── earnings.service.ts      # Partner earnings
├── review.service.ts        # Reviews
└── search.service.ts        # Search functionality
```

---

## 1. Auth Service (auth.service.ts)

### Purpose

Handle user authentication (login, register, logout)

### Code Breakdown:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
```

**Why `@Injectable({ providedIn: 'root' })`?**

- Makes service available app-wide (singleton)
- No need to add to providers array
- Tree-shakeable (removed if not used)

**Why `inject()` instead of constructor?**

- Modern Angular syntax (v14+)
- Cleaner, more concise
- Works with standalone components

### Login Method:

```typescript
login(credentials: LoginCredentials): Observable<AuthResponse> {
  // 1. Make HTTP POST request
  return this.http
    .post<User[]>(`${API_URL}/users`, null, {
      params: {
        email: credentials.email,
        password: credentials.password,
        role: credentials.role
      }
    })
    .pipe(
      // 2. Transform response
      map((users) => {
        if (users.length === 0) {
          throw new Error('Invalid credentials');
        }

        const user = users[0];
        const token = btoa(`${user.email}:${Date.now()}`);

        return { user, token };
      }),

      // 3. Handle errors
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Login failed';
        return throwError(() => new Error(message));
      })
    );
}
```

**Line-by-line explanation:**

1. **`this.http.post<User[]>`**

   - `post`: HTTP POST method
   - `<User[]>`: TypeScript generic - tells what type we expect back
   - Returns Observable (async operation)

2. **`params: { email, password, role }`**

   - Query parameters for JSON Server
   - JSON Server filters: `/users?email=x&password=y&role=z`

3. **`.pipe()`**

   - RxJS operator to transform Observable
   - Chain multiple operations

4. **`map((users) => { ... })`**

   - Transform API response
   - Check if user exists
   - Generate fake token (in real app, backend does this)
   - Return user + token

5. **`btoa()`**

   - Base64 encode (simple token generation)
   - Real app would use JWT from backend

6. **`catchError()`**
   - Catch HTTP errors
   - Transform into user-friendly message
   - `throwError()` creates new error Observable

**Why return Observable instead of Promise?**

- Observables are cancellable
- Can use RxJS operators (map, filter, etc.)
- Better for streams of data
- Angular's HttpClient uses Observables

### Register Method:

```typescript
register(userData: RegisterData): Observable<AuthResponse> {
  // 1. Create new user object
  const newUser: User = {
    id: crypto.randomUUID(),  // Generate unique ID
    userName: userData.userName,
    phoneNumber: userData.phoneNumber,
    role: userData.role,
    email: userData.email,
    password: userData.password,
    bio: userData.bio || '',
    addresses: userData.addresses || []
  };

  // 2. Add bank account if partner
  if (userData.role === 'partner' && userData.bankAccount) {
    newUser.bankAccount = userData.bankAccount;
  }

  // 3. POST to create user
  return this.http.post<User>(`${API_URL}/users`, newUser).pipe(
    map((user) => {
      const token = btoa(`${user.email}:${Date.now()}`);
      return { user, token };
    }),
    catchError(this.handleError)
  );
}
```

**Why `crypto.randomUUID()`?**

- Generates unique ID for new user
- In real app, backend generates ID

**Why check role for bank account?**

- Only partners need bank accounts
- Users don't have this field

**Why `userData.bio || ''`?**

- Default to empty string if not provided
- Prevents undefined values

---

## 2. Services Service (services.service.ts)

### Purpose

Manage service listings (CRUD operations, filtering, sorting)

### Key Methods:

#### Get All Services:

```typescript
getAllServices(): Observable<ServiceEntity[]> {
  return this.http
    .get<ServiceEntity[]>(`${API_URL}/services`)
    .pipe(catchError(this.handleError));
}
```

**Simple GET request:**

- Fetch all services from `/services` endpoint
- Return as Observable array
- Catch any errors

#### Get Service by ID:

```typescript
getServiceById(id: string): Observable<ServiceEntity> {
  return this.http
    .get<ServiceEntity>(`${API_URL}/services/${id}`)
    .pipe(catchError(this.handleError));
}
```

**Why separate method?**

- Different endpoint (`/services/123`)
- Returns single service, not array
- Used in service detail page

#### Filter Services:

```typescript
filterServices(filters: ServiceFilter): Observable<ServiceEntity[]> {
  return this.getAllServices().pipe(
    map((services) => this.applyFilters(services, filters))
  );
}

private applyFilters(
  services: ServiceEntity[],
  filters: ServiceFilter
): ServiceEntity[] {
  return services.filter((service) => {
    // Category filter
    if (filters.categoryId && service.categoryId !== filters.categoryId) {
      return false;
    }

    // Price range filter
    const finalPrice = this.calculateFinalPrice(service);
    if (filters.priceMin !== undefined && finalPrice < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== undefined && finalPrice > filters.priceMax) {
      return false;
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      const avgRating = this.calculateAverageRating(service.ratings);
      if (avgRating < filters.minRating) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = service.title.toLowerCase().includes(query);
      if (!titleMatch) {
        return false;
      }
    }

    return true;  // Passed all filters
  });
}
```

**Why client-side filtering?**

- JSON Server has limited filtering
- More control over filter logic
- Can combine multiple filters

**How filtering works:**

1. Get all services
2. Loop through each service
3. Check each filter condition
4. Return false if doesn't match (exclude)
5. Return true if passes all filters (include)

**Why `map()` operator?**

- Transform Observable data
- Apply filters to array
- Return filtered array

#### Calculate Final Price:

```typescript
calculateFinalPrice(service: ServiceEntity): number {
  if (service.hasOffer && service.offerDiscount > 0) {
    const discount = service.price * (service.offerDiscount / 100);
    return Math.round((service.price - discount) * 100) / 100;
  }
  return service.price;
}
```

**Why this calculation?**

- Apply discount if service has offer
- `offerDiscount` is percentage (20 = 20%)
- `Math.round(...* 100) / 100` rounds to 2 decimals

**Example:**

- Price: ₹1000
- Discount: 20%
- Calculation: 1000 - (1000 \* 0.20) = ₹800

#### Sort Services:

```typescript
sortByPrice(
  services: ServiceEntity[],
  order: 'asc' | 'desc' = 'asc'
): ServiceEntity[] {
  return [...services].sort((a, b) => {
    const priceA = this.calculateFinalPrice(a);
    const priceB = this.calculateFinalPrice(b);
    return order === 'asc' ? priceA - priceB : priceB - priceA;
  });
}
```

**Why `[...services]`?**

- Spread operator creates new array
- Don't mutate original array
- Immutability principle

**How sort works:**

- Compare two services (a, b)
- Return negative: a comes first
- Return positive: b comes first
- Return 0: keep order

**Ascending vs Descending:**

- `asc`: priceA - priceB (low to high)
- `desc`: priceB - priceA (high to low)

---

## 3. Booking Service (booking.service.ts)

### Purpose

Manage bookings (create, update status, get by user/partner)

### Get Bookings by Partner:

```typescript
getBookingsByPartnerId(partnerId: string): Observable<Booking[]> {
  return forkJoin({
    bookings: this.getAllBookings(),
    services: this.http.get<ServiceEntity[]>(`${API_URL}/services`)
  }).pipe(
    map(({ bookings, services }) => {
      // Create map of serviceId -> partnerId
      const servicePartnerMap = new Map<string, string>();
      services.forEach((service) => {
        servicePartnerMap.set(service.id, service.partnerId);
      });

      // Filter bookings by partner
      return bookings.filter((booking) => {
        const bookingPartnerId = servicePartnerMap.get(booking.serviceId);
        return bookingPartnerId === partnerId;
      });
    }),
    catchError(this.handleError)
  );
}
```

**Why `forkJoin`?**

- Make multiple API calls in parallel
- Wait for all to complete
- Combine results

**Why this complex logic?**

- Bookings don't have partnerId directly
- Bookings have serviceId
- Services have partnerId
- Need to join: Booking → Service → Partner

**Step-by-step:**

1. Get all bookings
2. Get all services
3. Create map: serviceId → partnerId
4. Filter bookings where service belongs to partner

### Create Booking:

```typescript
createBooking(booking: BookingCreate): Observable<Booking> {
  const newBooking: Booking = {
    id: crypto.randomUUID(),
    ...booking,
    convenienceFee: CONVENIENCE_FEE,  // ₹50
    status: 'confirmed',
    createdAt: Date.now()
  };

  return this.http
    .post<Booking>(`${API_URL}/bookings`, newBooking)
    .pipe(catchError(this.handleError));
}
```

**Why add these fields?**

- `id`: Unique identifier
- `convenienceFee`: Platform fee (₹50)
- `status`: Default to 'confirmed'
- `createdAt`: Timestamp for sorting

### Update Booking Status:

```typescript
updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
  const update: Partial<Booking> = { status };

  if (status === 'completed') {
    update.completedAt = Date.now();
  } else if (status.startsWith('cancelled')) {
    update.cancelledAt = Date.now();
  }

  return this.http
    .patch<Booking>(`${API_URL}/bookings/${id}`, update)
    .pipe(catchError(this.handleError));
}
```

**Why `Partial<Booking>`?**

- Only updating some fields, not all
- TypeScript allows partial object

**Why add timestamps?**

- Track when booking completed/cancelled
- Used for analytics, history

**Why `patch` instead of `put`?**

- `PATCH`: Update specific fields
- `PUT`: Replace entire object
- More efficient, safer

---

## 4. Search Service (search.service.ts)

### Purpose

Coordinate search between header and dashboard (component communication)

### Code:

```typescript
@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
  private showResultsSubject = new BehaviorSubject<boolean>(false);

  searchQuery$ = this.searchQuerySubject.asObservable();
  searchResults$ = this.searchResultsSubject.asObservable();
  showResults$ = this.showResultsSubject.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setSearchResults(results: SearchResult[]) {
    this.searchResultsSubject.next(results);
  }

  clearSearch() {
    this.searchQuerySubject.next('');
    this.searchResultsSubject.next([]);
    this.showResultsSubject.next(false);
  }
}
```

**What is BehaviorSubject?**

- Special type of Observable
- Stores current value
- New subscribers get current value immediately
- Can push new values with `.next()`

**Why use this pattern?**

- Header and Dashboard are unrelated components
- Can't use @Input/@Output
- Service acts as messenger

**How it works:**

1. User types in header search
2. Header calls `setSearchQuery('plumbing')`
3. Dashboard subscribes to `searchQuery$`
4. Dashboard receives 'plumbing'
5. Dashboard performs search
6. Dashboard calls `setSearchResults([...])`
7. Header can display result count

**Why three separate subjects?**

- `searchQuery`: What user typed
- `searchResults`: What was found
- `showResults`: Whether to display dropdown

---

## Common Patterns

### 1. Error Handling:

```typescript
private handleError(error: HttpErrorResponse) {
  const message = error.error?.message || error.message || 'Something went wrong';
  return throwError(() => new Error(message));
}
```

**Why centralized error handling?**

- Don't repeat error logic
- Consistent error messages
- Easy to modify

### 2. API URL Configuration:

```typescript
const API_URL = typeof window === 'undefined' ? 'http://localhost:3000' : (window as any)?.environment?.apiUrl ?? 'http://localhost:3000';
```

**Why this check?**

- Server-side rendering compatibility
- Can override with environment variable
- Defaults to localhost

### 3. Type Safety:

```typescript
getAllServices(): Observable<ServiceEntity[]> {
  return this.http.get<ServiceEntity[]>(`${API_URL}/services`)
}
```

**Why `<ServiceEntity[]>`?**

- TypeScript knows return type
- Autocomplete in IDE
- Catch type errors at compile time

---

## Service vs Component Responsibility

### ❌ BAD - Component doing too much:

```typescript
export class ServicesComponent {
  loadServices() {
    this.http.get('http://localhost:3000/services').subscribe((services) => {
      this.services = services.filter((s) => s.active);
      this.services.sort((a, b) => a.price - b.price);
    });
  }
}
```

**Problems:**

- Component knows about HTTP
- Component knows API URL
- Hard to test
- Can't reuse logic

### ✅ GOOD - Service handles logic:

```typescript
// Service
export class ServicesService {
  getActiveServices(): Observable<ServiceEntity[]> {
    return this.http.get<ServiceEntity[]>(`${API_URL}/services`).pipe(map((services) => services.filter((s) => s.active)));
  }

  sortByPrice(services: ServiceEntity[]): ServiceEntity[] {
    return [...services].sort((a, b) => a.price - b.price);
  }
}

// Component
export class ServicesComponent {
  loadServices() {
    this.servicesService.getActiveServices().subscribe((services) => {
      this.services = this.servicesService.sortByPrice(services);
    });
  }
}
```

**Benefits:**

- Component is simple
- Service is reusable
- Easy to test
- Easy to modify

---

## Testing Services

### Why services are easy to test:

```typescript
describe('ServicesService', () => {
  let service: ServicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServicesService]
    });

    service = TestBed.inject(ServicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should get all services', () => {
    const mockServices = [{ id: '1', title: 'Test' }];

    service.getAllServices().subscribe((services) => {
      expect(services).toEqual(mockServices);
    });

    const req = httpMock.expectOne(`${API_URL}/services`);
    expect(req.request.method).toBe('GET');
    req.flush(mockServices);
  });
});
```

---

This covers the service layer. Next document will cover component architecture and communication.
