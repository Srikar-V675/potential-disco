# Components and Routing - Deep Dive

## Component Architecture

### What is a Component?

A component is a **building block** of your UI. It has:

- **Template (HTML):** What users see
- **Class (TypeScript):** Logic and data
- **Styles (SCSS):** How it looks
- **Metadata (@Component):** Configuration

---

## Component Lifecycle

### Key Lifecycle Hooks:

```typescript
export class MyComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // Called once after component is created
    // Perfect for: API calls, subscriptions, initialization
  }

  ngOnDestroy() {
    // Called before component is destroyed
    // Perfect for: cleanup, unsubscribe, clear timers
  }
}
```

**Why these two are most important?**

- `ngOnInit`: Component is ready, do setup
- `ngOnDestroy`: Component is leaving, clean up

---

## Example: User Dashboard Component

### File Structure:

```
user-dashboard/
├── user-dashboard.component.ts      # Logic
├── user-dashboard.component.html    # Template
├── user-dashboard.component.scss    # Styles
```

### TypeScript Class:

```typescript
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit, OnDestroy {
```

**Decorator Breakdown:**

1. **`@Component`** - Marks class as Angular component

2. **`selector: 'app-user-dashboard'`**

   - How to use in HTML: `<app-user-dashboard></app-user-dashboard>`
   - Convention: `app-` prefix

3. **`standalone: true`**

   - Modern Angular (v14+)
   - No need for NgModule
   - Self-contained component

4. **`imports: [CommonModule, FormsModule, RouterModule]`**

   - What this component needs
   - `CommonModule`: *ngIf, *ngFor, pipes
   - `FormsModule`: [(ngModel)] two-way binding
   - `RouterModule`: [routerLink] navigation

5. **`templateUrl` & `styleUrl`**
   - External files (cleaner than inline)
   - Could use `template` & `styles` for inline

### Dependency Injection:

```typescript
export class UserDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private searchService = inject(SearchService);
  private servicesService = inject(ServicesService);
  private bookingService = inject(BookingService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();
```

**Why `inject()` function?**

- Modern syntax (Angular 14+)
- Cleaner than constructor injection
- Works better with standalone components

**Old way (constructor injection):**

```typescript
constructor(
  private router: Router,
  private store: Store,
  // ... many more
) {}
```

**Why `private`?**

- Only accessible within class
- Not exposed to template
- Good practice

**What is `destroy$`?**

- Subject for cleanup
- Used with `takeUntil()` to unsubscribe
- Prevents memory leaks

### Component Properties:

```typescript
currentUser: User | null = null;
searchResults: ServiceEntity[] = [];
showSearchResults = false;
recentBookings: Booking[] = [];
recommendedServices: ServiceEntity[] = [];
categories: Category[] = [];
showChat = false;
chatMessages: { text: string; isUser: boolean; timestamp: Date }[] = [];
newMessage = '';
```

**Why type annotations?**

- `User | null`: Can be User object or null
- `ServiceEntity[]`: Array of services
- `boolean`: True or false
- TypeScript catches errors

**Why initialize values?**

- Avoid undefined errors
- Clear initial state
- Better than `!` (non-null assertion)

### ngOnInit - Initialization:

```typescript
ngOnInit() {
  // 1. Subscribe to current user from store
  this.store.select(AuthSelectors.selectCurrentUser).pipe(
    filter((user): user is User => !!user && !!user.id),
    takeUntil(this.destroy$)
  ).subscribe(user => {
    this.currentUser = user;
    this.loadDashboardData();
  });

  // 2. Subscribe to search queries from header
  this.searchService.searchQuery$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(query => {
    if (query.trim()) {
      this.performSearch(query);
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  });

  // 3. Subscribe to show results flag
  this.searchService.showResults$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(show => {
    this.showSearchResults = show;
  });

  // 4. Load categories
  this.loadCategories();
}
```

**Line-by-line explanation:**

**1. Get Current User:**

```typescript
this.store.select(AuthSelectors.selectCurrentUser);
```

- Get user from NgRx store
- Returns Observable

```typescript
.pipe(filter((user): user is User => !!user && !!user.id))
```

- Filter out null/undefined users
- `user is User`: TypeScript type guard
- `!!user`: Convert to boolean (null → false)
- Only proceed if user exists with ID

```typescript
.pipe(takeUntil(this.destroy$))
```

- Unsubscribe when component destroyed
- Prevents memory leaks
- `destroy$` emits in ngOnDestroy

```typescript
.subscribe(user => {
  this.currentUser = user;
  this.loadDashboardData();
})
```

- When user changes, update local property
- Load dashboard data for this user

**2. Listen for Search:**

```typescript
this.searchService.searchQuery$.subscribe((query) => {
  if (query.trim()) {
    this.performSearch(query);
  }
});
```

- Header types search query
- Dashboard receives it
- Perform search if not empty

**Why this pattern?**

- Header and Dashboard are separate
- Can't use @Input/@Output
- Service acts as messenger

### ngOnDestroy - Cleanup:

```typescript
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
  this.searchService.clearSearch();
}
```

**Why this is important:**

1. **`this.destroy$.next()`**

   - Emit value to destroy$ Subject
   - All `takeUntil(this.destroy$)` unsubscribe
   - Prevents memory leaks

2. **`this.destroy$.complete()`**

   - Mark Subject as complete
   - No more values will be emitted
   - Good practice

3. **`this.searchService.clearSearch()`**
   - Clear search state
   - Clean up for next time
   - Prevent stale data

**What happens without cleanup?**

- Subscriptions keep running
- Memory leaks
- Multiple subscriptions pile up
- Performance degrades

### Methods:

#### Load Dashboard Data:

```typescript
loadDashboardData() {
  if (!this.currentUser) return;

  // Load recent bookings
  this.bookingService.getBookingsByUserId(this.currentUser.id).subscribe({
    next: (bookings) => {
      this.recentBookings = bookings
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3);
    },
    error: (err) => {
      console.error('Error loading bookings:', err);
    }
  });

  // Load recommended services
  this.servicesService.getActiveServices().subscribe({
    next: (services) => {
      this.recommendedServices = services.slice(0, 4);
    },
    error: (err) => {
      console.error('Error loading services:', err);
    }
  });
}
```

**Why guard clause?**

```typescript
if (!this.currentUser) return;
```

- Don't proceed if no user
- Prevents errors
- Early return pattern

**Why `subscribe({ next, error })`?**

- Modern RxJS syntax
- Separate success and error handling
- More readable than single function

**Why sort bookings?**

```typescript
.sort((a, b) => dateB - dateA)
```

- Show most recent first
- Descending order (newest to oldest)

**Why `.slice(0, 3)`?**

- Only show 3 recent bookings
- Don't overwhelm UI
- "View All" button for more

#### Navigation Methods:

```typescript
browseServices() {
  this.router.navigate(['/user/services']);
}

viewService(serviceId: string) {
  this.router.navigate(['/user/service', serviceId]);
}

viewCategory(categoryId: string) {
  this.router.navigate(['/user/services'], {
    queryParams: { category: categoryId }
  });
}
```

**Why separate methods?**

- Reusable
- Testable
- Can add logic before navigation

**Different navigation patterns:**

1. **Simple route:**

```typescript
this.router.navigate(['/user/services']);
// Goes to: /user/services
```

2. **Route with parameter:**

```typescript
this.router.navigate(['/user/service', serviceId]);
// Goes to: /user/service/123
```

3. **Route with query params:**

```typescript
this.router.navigate(['/user/services'], {
  queryParams: { category: 'cat-001' }
});
// Goes to: /user/services?category=cat-001
```

---

## Template Syntax

### Data Binding:

#### 1. Interpolation (One-way: Component → Template)

```html
<h1>{{ welcomeMessage }}</h1>
<p>Total: {{ price * quantity }}</p>
```

#### 2. Property Binding (One-way: Component → Template)

```html
<img [src]="imageUrl" [alt]="imageAlt" /> <button [disabled]="isLoading">Submit</button>
```

#### 3. Event Binding (One-way: Template → Component)

```html
<button (click)="onSubmit()">Submit</button> <input (input)="onSearchInput($event)" />
```

#### 4. Two-way Binding (Both directions)

```html
<input [(ngModel)]="searchQuery" />
<!-- Equivalent to: -->
<input [ngModel]="searchQuery" (ngModelChange)="searchQuery = $event" />
```

### Structural Directives:

#### \*ngIf - Conditional Rendering

```html
<!-- Show if condition is true -->
<div *ngIf="isLoggedIn">Welcome back!</div>

<!-- Show if true, else show alternative -->
<div *ngIf="services.length > 0; else noServices">
  <p>Found {{ services.length }} services</p>
</div>
<ng-template #noServices>
  <p>No services found</p>
</ng-template>
```

**Why use \*ngIf?**

- Element not in DOM if false (better performance)
- Different from `[hidden]` (element still in DOM)

#### \*ngFor - Loop Through Array

```html
<div *ngFor="let service of services; let i = index">
  <h3>{{ i + 1 }}. {{ service.title }}</h3>
  <p>{{ service.price }}</p>
</div>
```

**Available variables:**

- `let i = index`: Current index (0, 1, 2...)
- `let first = first`: Is first item?
- `let last = last`: Is last item?
- `let even = even`: Is even index?
- `let odd = odd`: Is odd index?

### Pipes:

```html
<!-- Date pipe -->
<p>{{ booking.schedule | date: 'MMM d, yyyy' }}</p>
<!-- Output: Jan 15, 2024 -->

<!-- Currency pipe -->
<p>{{ service.price | currency: 'INR' }}</p>
<!-- Output: ₹599.00 -->

<!-- Async pipe (auto subscribe/unsubscribe) -->
<div *ngIf="currentUser$ | async as user">Welcome, {{ user.userName }}!</div>
```

**Why async pipe?**

- Automatically subscribes to Observable
- Automatically unsubscribes on destroy
- Prevents memory leaks
- Cleaner than manual subscribe

---

## Routing

### Route Configuration:

```typescript
// user.routes.ts
export const USER_ROUTES: Routes = [
  { path: '', component: UserLandingComponent },
  { path: 'login', component: UserLoginComponent },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'services', component: ServiceListComponent },
  { path: 'service/:id', component: ServiceDetailComponent }
];
```

**Route types:**

1. **Static route:** `path: 'login'`

   - Exact match
   - `/user/login`

2. **Route parameter:** `path: 'service/:id'`

   - Dynamic segment
   - `/user/service/123`
   - Access with `route.snapshot.paramMap.get('id')`

3. **Empty path:** `path: ''`
   - Default route
   - `/user` → shows UserLandingComponent

### Accessing Route Parameters:

```typescript
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Get route parameter
    const serviceId = this.route.snapshot.paramMap.get('id');

    // Or subscribe to changes
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.loadService(id);
    });
  }
}
```

**Snapshot vs Observable:**

**Snapshot (one-time read):**

```typescript
const id = this.route.snapshot.paramMap.get('id');
```

- Use when: Component is destroyed and recreated on navigation
- Simpler
- Most common case

**Observable (reactive):**

```typescript
this.route.paramMap.subscribe((params) => {
  const id = params.get('id');
});
```

- Use when: Same component, different parameter
- Example: `/service/1` → `/service/2` (same component)
- Reacts to parameter changes

### Query Parameters:

```typescript
// Navigate with query params
this.router.navigate(['/services'], {
  queryParams: { category: 'cat-001', sort: 'price' }
});
// URL: /services?category=cat-001&sort=price

// Read query params
this.route.queryParams.subscribe((params) => {
  const category = params['category'];
  const sort = params['sort'];
});
```

### Route Guards:

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    map(isAuth => {
      if (isAuth) {
        return true;  // Allow navigation
      } else {
        router.navigate(['/login']);
        return false;  // Block navigation
      }
    })
  );
};

// Use in routes
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]  // Protected route
}
```

**Why guards?**

- Protect routes from unauthorized access
- Redirect to login if not authenticated
- Can check permissions, roles, etc.

---

## Component Communication

### 1. Parent → Child (@Input)

**Parent:**

```typescript
<app-booking-card [booking]="booking"></app-booking-card>
```

**Child:**

```typescript
export class BookingCardComponent {
  @Input() booking!: Booking;
}
```

**Why `!` (non-null assertion)?**

- Tells TypeScript: "I promise this will be set"
- Parent must provide value
- Error if not provided

### 2. Child → Parent (@Output)

**Child:**

```typescript
export class BookingCardComponent {
  @Output() statusChange = new EventEmitter<string>();

  onComplete() {
    this.statusChange.emit('completed');
  }
}
```

**Parent:**

```typescript
<app-booking-card
  [booking]="booking"
  (statusChange)="onStatusChange($event)">
</app-booking-card>

onStatusChange(newStatus: string) {
  console.log('Status changed to:', newStatus);
}
```

### 3. Unrelated Components (Service)

**Service:**

```typescript
@Injectable({ providedIn: 'root' })
export class SearchService {
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  setQuery(query: string) {
    this.querySubject.next(query);
  }
}
```

**Component A (Header):**

```typescript
onSearch(query: string) {
  this.searchService.setQuery(query);
}
```

**Component B (Dashboard):**

```typescript
ngOnInit() {
  this.searchService.query$.subscribe(query => {
    this.performSearch(query);
  });
}
```

---

## Common Patterns

### 1. Loading State:

```typescript
export class MyComponent {
  loading = false;

  loadData() {
    this.loading = true;

    this.service.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
```

```html
<div *ngIf="loading">Loading...</div>
<div *ngIf="!loading">{{ data }}</div>
```

### 2. Error Handling:

```typescript
export class MyComponent {
  error: string | null = null;

  loadData() {
    this.service.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.error = null;
      },
      error: (err) => {
        this.error = err.message;
      }
    });
  }
}
```

```html
<div *ngIf="error" class="error">{{ error }}</div>
```

### 3. Form Handling:

```typescript
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      // Process login
    } else {
      // Mark all as touched to show errors
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
```

---

## Performance Tips

### 1. TrackBy for \*ngFor:

```typescript
// Component
trackByServiceId(index: number, service: ServiceEntity) {
  return service.id;
}
```

```html
<!-- Template -->
<div *ngFor="let service of services; trackBy: trackByServiceId">{{ service.title }}</div>
```

**Why?**

- Angular knows which items changed
- Only re-renders changed items
- Better performance for large lists

### 2. OnPush Change Detection:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {}
```

**Why?**

- Only check when @Input changes
- Or when event fires
- Better performance

### 3. Unsubscribe Pattern:

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

This covers components and routing. The next document will cover specific features and flows.
