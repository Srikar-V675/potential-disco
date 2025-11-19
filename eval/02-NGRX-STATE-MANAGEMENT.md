# NgRx State Management - Deep Dive

## What is NgRx and Why Do We Use It?

**Simple Analogy:** Think of NgRx as a **bank vault** for your application's data.

- Everyone can **read** from it (selectors)
- Only **authorized actions** can change it (actions + reducers)
- All changes are **tracked** (predictable state)

---

## The NgRx Flow - Step by Step

```
Component → Action → Reducer → State → Selector → Component
```

### Real Example: User Login

1. **User clicks "Login" button**
2. **Component dispatches action:** `store.dispatch(login({ email, password }))`
3. **Effect intercepts:** Makes HTTP call to backend
4. **Backend responds:** Returns user data + token
5. **Effect dispatches success:** `store.dispatch(loginSuccess({ user, token }))`
6. **Reducer updates state:** Stores user and token
7. **Selector notifies components:** All subscribed components get new state
8. **UI updates:** Show user dashboard

---

## File Structure

```
store/auth/
├── auth.actions.ts      # What can happen (login, logout, etc.)
├── auth.effects.ts      # Side effects (API calls)
├── auth.reducer.ts      # How state changes
├── auth.selectors.ts    # How to read state
└── auth.state.ts        # Shape of state
```

---

## 1. Actions (auth.actions.ts)

### What Are Actions?

Actions are **events** that describe something that happened in your app.

### Code Breakdown:

```typescript
import { createAction, props } from '@ngrx/store';

// Login action - triggered when user submits login form
export const login = createAction(
  '[Auth] Login', // Unique identifier (convention: [Source] Event)
  props<{ email: string; password: string; role: 'user' | 'partner' }>()
);
```

**Why `props<>`?**

- Defines what data the action carries
- Type-safe (TypeScript will error if you forget email/password)

**Why `[Auth] Login` format?**

- `[Auth]` = Source (where action came from)
- `Login` = Event (what happened)
- Helps with debugging (you can see in Redux DevTools)

### All Actions Explained:

```typescript
// 1. LOGIN - User attempts to log in
export const login = createAction('[Auth] Login', props<{ email: string; password: string; role: 'user' | 'partner' }>());
// When: User clicks "Login" button
// Carries: Email, password, role
// Next: Effect makes API call

// 2. LOGIN SUCCESS - Backend confirms login
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; token: string }>());
// When: API returns success
// Carries: User object, auth token
// Next: Reducer stores in state

// 3. LOGIN FAILURE - Backend rejects login
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());
// When: API returns error
// Carries: Error message
// Next: Reducer stores error

// 4. REGISTER - User attempts to sign up
export const register = createAction('[Auth] Register', props<{ userData: any }>());
// When: User submits registration form
// Carries: All registration data
// Next: Effect makes API call

// 5. REGISTER SUCCESS - Registration complete
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: User; token: string }>());
// When: API confirms registration
// Carries: New user object, token
// Next: Reducer stores in state

// 6. REGISTER FAILURE - Registration failed
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());
// When: API rejects registration
// Carries: Error message
// Next: Reducer stores error

// 7. LOGOUT - User logs out
export const logout = createAction('[Auth] Logout');
// When: User clicks "Logout"
// Carries: Nothing
// Next: Reducer clears state

// 8. LOAD USER - Restore user from storage
export const loadUser = createAction('[Auth] Load User');
// When: App starts
// Carries: Nothing
// Next: Effect checks localStorage

// 9. LOAD USER SUCCESS - User restored
export const loadUserSuccess = createAction('[Auth] Load User Success', props<{ user: User; token: string }>());
// When: Found user in localStorage
// Carries: Stored user, token
// Next: Reducer restores state
```

---

## 2. State (auth.state.ts)

### What is State?

State is the **current snapshot** of your authentication data.

```typescript
export interface AuthState {
  user: User | null; // Currently logged-in user (null if not logged in)
  token: string | null; // JWT token for API calls (null if not logged in)
  isAuthenticated: boolean; // Quick check: is someone logged in?
  loading: boolean; // Are we waiting for API response?
  error: string | null; // Any error message to show user
}
```

### Initial State:

```typescript
export const initialAuthState: AuthState = {
  user: null, // No user logged in yet
  token: null, // No token yet
  isAuthenticated: false, // Not authenticated
  loading: false, // Not loading
  error: null // No errors
};
```

**Why these specific fields?**

1. **user** - Need to show user name, email, role in UI
2. **token** - Need to send with API requests for authorization
3. **isAuthenticated** - Quick boolean check (don't need to check if user !== null everywhere)
4. **loading** - Show spinner while logging in
5. **error** - Display error message if login fails

---

## 3. Reducer (auth.reducer.ts)

### What is a Reducer?

A reducer is a **pure function** that takes current state + action, returns new state.

**Pure Function Rules:**

- Same input = same output (predictable)
- No side effects (no API calls, no random numbers)
- Don't mutate state (create new object)

### Code Breakdown:

```typescript
import { createReducer, on } from '@ngrx/store';

export const authReducer = createReducer(
  initialAuthState,  // Starting point

  // When LOGIN action happens
  on(AuthActions.login, (state) => ({
    ...state,           // Keep everything from current state
    loading: true,      // Set loading to true (show spinner)
    error: null         // Clear any previous errors
  })),
```

**Why `...state`?**

- Spread operator copies all properties
- We only change what we need (loading, error)
- Immutability (don't modify original state)

**Why set `loading: true`?**

- User clicked login, API call is happening
- UI can show spinner/disable button

**Why set `error: null`?**

- Clear previous error (user is trying again)

### All Reducer Cases:

```typescript
// 1. LOGIN - User attempting to log in
on(AuthActions.login, (state) => ({
  ...state,
  loading: true, // Show loading spinner
  error: null // Clear previous errors
})),
  // 2. LOGIN SUCCESS - Login worked!
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user, // Store user object
    token, // Store auth token
    isAuthenticated: true, // Mark as authenticated
    loading: false, // Hide loading spinner
    error: null // No errors
  })),
  // 3. LOGIN FAILURE - Login failed
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null, // No user
    token: null, // No token
    isAuthenticated: false, // Not authenticated
    loading: false, // Hide loading spinner
    error // Store error message
  })),
  // 4. REGISTER - User attempting to register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true, // Show loading spinner
    error: null // Clear previous errors
  })),
  // 5. REGISTER SUCCESS - Registration worked!
  on(AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user, // Store new user
    token, // Store auth token
    isAuthenticated: true, // Mark as authenticated
    loading: false, // Hide loading spinner
    error: null // No errors
  })),
  // 6. REGISTER FAILURE - Registration failed
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    user: null, // No user
    token: null, // No token
    isAuthenticated: false, // Not authenticated
    loading: false, // Hide loading spinner
    error // Store error message
  })),
  // 7. LOGOUT - User logging out
  on(AuthActions.logout, () => initialAuthState),
  // Why return initialAuthState?
  // - Clears everything (user, token, etc.)
  // - Resets to fresh state
  // - Simple and clean

  // 8. LOAD USER SUCCESS - Restored from localStorage
  on(AuthActions.loadUserSuccess, (state, { user, token }) => ({
    ...state,
    user, // Restore user
    token, // Restore token
    isAuthenticated: true, // Mark as authenticated
    loading: false // Not loading
  }));
```

---

## 4. Effects (auth.effects.ts)

### What are Effects?

Effects handle **side effects** (things that interact with outside world):

- API calls
- LocalStorage
- Router navigation
- Logging

**Why not in reducer?**

- Reducers must be pure (no side effects)
- Effects can be async
- Effects can dispatch multiple actions

### Code Breakdown:

```typescript
@Injectable()
export class AuthEffects {
  private authService = inject(AuthService);
  private router = inject(Router);
  private actions$ = inject(Actions);  // Stream of all actions
```

**Why inject Actions?**

- `actions$` is an Observable of all dispatched actions
- We listen for specific actions and react to them

### Effect 1: Login

```typescript
login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.login), // Listen for LOGIN action

    switchMap(({ email, password, role }) =>
      // Make API call
      this.authService.login({ email, password, role }).pipe(
        // If successful
        map((response) => {
          // Save to localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));

          // Navigate to appropriate dashboard
          if (role === 'partner') {
            this.router.navigate(['/partner/dashboard']);
          } else {
            this.router.navigate(['/user/dashboard']);
          }

          // Dispatch success action
          return AuthActions.loginSuccess({
            user: response.user,
            token: response.token
          });
        }),

        // If error
        catchError((error) =>
          // Dispatch failure action
          of(AuthActions.loginFailure({ error: error.message }))
        )
      )
    )
  )
);
```

**Why `switchMap`?**

- Cancels previous API call if new one starts
- Example: User clicks login twice quickly, only last one matters

**Why `map` for success?**

- Transform API response into action
- Do side effects (localStorage, navigation)
- Return new action

**Why `catchError`?**

- Handle API errors gracefully
- Return failure action instead of breaking stream
- `of()` creates Observable from value

**Why save to localStorage?**

- Persist login across page refreshes
- User doesn't need to login again

**Why navigate in effect?**

- Navigation is a side effect
- Keeps component clean
- Centralized navigation logic

### Effect 2: Register

```typescript
register$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.register), // Listen for REGISTER action

    switchMap(({ userData }) =>
      this.authService.register(userData).pipe(
        map((response) => {
          // Same as login: save and navigate
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));

          if (userData.role === 'partner') {
            this.router.navigate(['/partner/dashboard']);
          } else {
            this.router.navigate(['/user/dashboard']);
          }

          return AuthActions.registerSuccess({
            user: response.user,
            token: response.token
          });
        }),
        catchError((error) => of(AuthActions.registerFailure({ error: error.message })))
      )
    )
  )
);
```

### Effect 3: Logout

```typescript
logout$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.logout), // Listen for LOGOUT action
      tap(() => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Navigate to home
        this.router.navigate(['/']);
      })
    ),
  { dispatch: false } // Don't dispatch another action
);
```

**Why `tap` instead of `map`?**

- `tap` is for side effects that don't return value
- We're just clearing storage and navigating

**Why `{ dispatch: false }`?**

- This effect doesn't dispatch another action
- Just does side effects and stops

### Effect 4: Load User

```typescript
loadUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.loadUser), // Listen for LOAD_USER action
    map(() => {
      // Try to get from localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        // Found user, dispatch success
        return AuthActions.loadUserSuccess({ user, token });
      }

      // No user found, dispatch failure
      return AuthActions.loginFailure({ error: 'No user found' });
    })
  )
);
```

**Why load user on app start?**

- Restore login state after page refresh
- User doesn't need to login again

**When is this called?**

- In `app.component.ts` on initialization

---

## 5. Selectors (auth.selectors.ts)

### What are Selectors?

Selectors are **queries** for your state. Like SQL queries for your store.

**Why use selectors?**

- Memoization (cache results, don't recalculate)
- Composable (build complex selectors from simple ones)
- Type-safe
- Testable

### Code Breakdown:

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';

// 1. Get the entire auth state
export const selectAuthState = createFeatureSelector<AuthState>('auth');
```

**What is `createFeatureSelector`?**

- Gets a top-level slice of state
- `'auth'` matches the key in app config

```typescript
// 2. Get current user
export const selectCurrentUser = createSelector(
  selectAuthState, // Input: auth state
  (state) => state.user // Output: just the user
);
```

**Why not just `state.auth.user` in component?**

- Memoization: If state doesn't change, returns cached value
- Reusability: Multiple components use same selector
- Testability: Easy to test selectors

```typescript
// 3. Get auth token
export const selectAuthToken = createSelector(selectAuthState, (state) => state.token);

// 4. Check if authenticated
export const selectIsAuthenticated = createSelector(selectAuthState, (state) => state.isAuthenticated);

// 5. Check if loading
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);

// 6. Get error message
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
```

### Using Selectors in Components:

```typescript
// In component
export class DashboardComponent {
  private store = inject(Store);

  currentUser$ = this.store.select(selectCurrentUser);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  // In template
  // <div *ngIf="isAuthenticated$ | async">Welcome!</div>
}
```

**Why `$` suffix?**

- Convention: indicates Observable
- Helps distinguish from regular variables

**Why `| async` pipe?**

- Automatically subscribes/unsubscribes
- Prevents memory leaks
- Updates UI when state changes

---

## Complete Flow Example: User Login

### Step 1: User Fills Form and Clicks Login

```typescript
// login.component.ts
onSubmit() {
  const { email, password } = this.form.value;

  // Dispatch login action
  this.store.dispatch(AuthActions.login({
    email,
    password,
    role: 'user'
  }));
}
```

### Step 2: Reducer Updates State (Loading)

```typescript
// auth.reducer.ts
on(AuthActions.login, (state) => ({
  ...state,
  loading: true, // UI shows spinner
  error: null
}));
```

### Step 3: Effect Makes API Call

```typescript
// auth.effects.ts
login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.login),
    switchMap(
      ({ email, password, role }) => this.authService.login({ email, password, role })
      // API call happens here
    )
  )
);
```

### Step 4: API Responds Successfully

```typescript
// Effect continues...
map((response) => {
  // Save to localStorage
  localStorage.setItem('token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));

  // Navigate
  this.router.navigate(['/user/dashboard']);

  // Dispatch success
  return AuthActions.loginSuccess({
    user: response.user,
    token: response.token
  });
});
```

### Step 5: Reducer Updates State (Success)

```typescript
// auth.reducer.ts
on(AuthActions.loginSuccess, (state, { user, token }) => ({
  ...state,
  user,
  token,
  isAuthenticated: true,
  loading: false, // Hide spinner
  error: null
}));
```

### Step 6: Components React to State Change

```typescript
// Any component subscribed to selectors gets updated
this.store.select(selectCurrentUser).subscribe((user) => {
  console.log('User logged in:', user);
  // UI updates automatically
});
```

---

## Common Questions

### Q: Why not just use a service with BehaviorSubject?

**A:** NgRx provides:

- Time-travel debugging (Redux DevTools)
- Predictable state changes
- Better testing
- Scalability for large apps

### Q: When should I use NgRx vs simple service?

**A:** Use NgRx when:

- State is shared across many components
- State needs to persist (like auth)
- You need to track state changes (debugging)

Use service when:

- State is local to one component
- Simple CRUD operations
- Temporary data

### Q: What if API call fails?

**A:** Effect catches error and dispatches failure action:

```typescript
catchError((error) => of(AuthActions.loginFailure({ error: error.message })));
```

Reducer updates state with error:

```typescript
on(AuthActions.loginFailure, (state, { error }) => ({
  ...state,
  loading: false,
  error // Component can display this
}));
```

---

This covers NgRx in detail. Next document will cover Services and API calls.
