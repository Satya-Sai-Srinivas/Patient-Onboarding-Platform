# Error Handling & Navigation Guide

## Overview

This guide explains the comprehensive error handling and navigation setup for the patient check-in app.

---

## Navigation Flow

### Stack Navigator Flow

```
Landing → RoleSelect → PhoneInput → OTPVerify → QRScan/CheckInSuccess
```

### Screen Transitions

All screens use **horizontal slide transitions** (`CardStyleInterpolators.forHorizontalIOS`) for a smooth, iOS-like experience.

### Gesture Configuration

- **Back gestures enabled**: Landing, RoleSelect, PhoneInput, OTPVerify, QRScan
- **Back gesture disabled**: CheckInSuccess (prevents accidental navigation away from success screen)

---

## Error Handling System

### 1. ErrorBoundary Component

**Location**: `src/components/ErrorBoundary.tsx`

**Purpose**: Catches and handles React component crashes

**Features**:
- Catches all unhandled JavaScript errors in component tree
- Shows user-friendly error screen
- "Try Again" button to reset error state
- "Reload App" button for critical errors
- Shows error details in development mode

**Usage**:
```tsx
// Already wrapped around NavigationContainer in AppNavigator.tsx
<ErrorBoundary>
  <NavigationContainer>
    {/* screens */}
  </NavigationContainer>
</ErrorBoundary>
```

---

### 2. Global Error Handler

**Location**: `src/utils/errorHandler.ts`

**Features**:
- Centralized error parsing and handling
- User-friendly error messages
- Network error detection
- Automatic retry logic
- Integration with error tracking services

**Error Types Handled**:

#### Network Errors
```typescript
// Message: "Connection error. Please check your internet."
// Detected when: error.isNetworkError === true
```

#### Server Errors (5xx)
```typescript
// Message: "Something went wrong. Please try again."
// Detected when: status >= 500
```

#### Client Errors (4xx)
```typescript
// 400: Invalid input
// 401: Session expired
// 404: Resource not found
// 429: Too many attempts
```

**Functions**:

```typescript
// Parse error and get user-friendly message
const errorDetails = parseError(error);

// Show error alert with optional retry
showErrorAlert(error, onRetry?, customTitle?);

// Retry function with exponential backoff
const result = await withRetry(asyncFunction, maxRetries?, delayMs?);

// Check network connection
const isOnline = await checkNetworkConnection();
```

---

### 3. LoadingOverlay Component

**Location**: `src/components/LoadingOverlay.tsx`

**Purpose**: Reusable loading indicator to prevent multiple button presses

**Features**:
- Full-screen semi-transparent overlay
- ActivityIndicator with custom message
- Blocks user interaction during loading
- Smooth fade animation

**Usage**:
```tsx
import LoadingOverlay from '@/components/LoadingOverlay';

const MyScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await someApiCall();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your content */}
      <LoadingOverlay visible={loading} message="Processing..." />
    </View>
  );
};
```

---

## API Error Handling

### BaseClient Error Handling

**Location**: `src/services/api/baseClient.ts`

**Features**:
- Automatic token management
- Request/response interceptors
- Status code mapping to user messages
- Network error detection

**Error Messages**:

| Status | Message |
|--------|---------|
| 400 | Invalid request. Please check your input and try again. |
| 401 | Your session has expired. Please log in again. |
| 404 | The requested resource was not found. |
| 429 | Too many attempts. Please wait a moment and try again. |
| 500-503 | Server error. Please try again later. |
| 504 | Request timeout. Please check your connection and try again. |
| Network | No internet connection. Please check your network and try again. |

---

## Best Practices

### 1. API Calls with Error Handling

```tsx
import { showErrorAlert } from '@/utils/errorHandler';
import LoadingOverlay from '@/components/LoadingOverlay';

const MyScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleApiCall = async () => {
    setLoading(true);
    try {
      const response = await patientApi.someMethod();
      // Handle success
    } catch (error) {
      showErrorAlert(error, handleApiCall); // Auto-retry on network/server errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Your UI */}
      <LoadingOverlay visible={loading} message="Loading..." />
    </>
  );
};
```

### 2. Retry Logic for Critical Operations

```tsx
import { withRetry } from '@/utils/errorHandler';

const fetchCriticalData = async () => {
  const data = await withRetry(
    () => patientApi.getCriticalData(),
    3,    // max retries
    1000  // initial delay (ms)
  );
  return data;
};
```

### 3. Network Connection Check

```tsx
import { checkNetworkConnection, showErrorAlert } from '@/utils/errorHandler';

const handleOfflineAction = async () => {
  const isOnline = await checkNetworkConnection();

  if (!isOnline) {
    Alert.alert(
      'No Internet',
      'This feature requires an internet connection.'
    );
    return;
  }

  // Proceed with online operation
};
```

---

## Error Flow Diagram

```
┌─────────────────────────┐
│  User Action (API Call) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Show LoadingOverlay   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    Execute API Call     │
└─────┬──────────┬────────┘
      │          │
   Success    Error
      │          │
      │          ▼
      │  ┌──────────────────┐
      │  │   Parse Error    │
      │  │ (errorHandler.ts)│
      │  └────────┬─────────┘
      │           │
      │           ▼
      │  ┌──────────────────┐     ┌──────────────┐
      │  │ Network/Server?  │─Yes→│ Show Retry   │
      │  └────────┬─────────┘     │    Button    │
      │           │                └──────────────┘
      │          No
      │           │
      │           ▼
      │  ┌──────────────────┐
      │  │  Show Error      │
      │  │    Message       │
      │  └──────────────────┘
      │
      ▼
┌─────────────────────────┐
│   Hide LoadingOverlay   │
└─────────────────────────┘
```

---

## Testing Error Handling

### 1. Test Network Errors

```tsx
// Simulate by turning off WiFi/cellular
// Expected: "Connection error. Please check your internet."
```

### 2. Test Server Errors

```tsx
// Use mock API that returns 500
// Expected: "Something went wrong. Please try again."
```

### 3. Test Component Crash

```tsx
// Throw error in render
// Expected: ErrorBoundary screen with "Try Again" button
```

### 4. Test Loading States

```tsx
// Click button multiple times rapidly
// Expected: Only one request sent, button disabled during loading
```

---

## Future Enhancements

### 1. Error Tracking Integration

Add Sentry or similar service:

```tsx
// In ErrorBoundary.tsx
componentDidCatch(error, errorInfo) {
  Sentry.captureException(error, { extra: errorInfo });
}

// In errorHandler.ts
setupGlobalErrorHandler() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  });
}
```

### 2. Offline Queue

Implement request queue for offline scenarios:

```tsx
// Queue failed requests
// Retry when connection restored
```

### 3. Custom Error Analytics

Track error patterns:

```tsx
// Log error frequency
// Identify problematic API endpoints
// Monitor error resolution rates
```

---

## Summary

✅ **Navigation**: Smooth slide transitions with proper gesture handling
✅ **ErrorBoundary**: Catches React component crashes
✅ **Global Error Handler**: Centralized error parsing and user messages
✅ **LoadingOverlay**: Prevents multiple submissions and shows loading state
✅ **API Error Handling**: Automatic retry logic for network/server errors
✅ **User-Friendly Messages**: All errors mapped to readable messages
✅ **Retry Logic**: Exponential backoff for failed requests

The error handling system is production-ready and provides a robust user experience!
