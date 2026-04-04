# API Integration Complete - Healthcare Queue Management System

## Overview

A comprehensive API service layer has been implemented for the healthcare queue management system. The implementation includes proper error handling, TypeScript types, and user-friendly error messages.

## What's Been Created

### 1. Enhanced Base API Client (`src/services/api/baseClient.ts`)

**Features:**
- ✅ Axios instance with authentication token management
- ✅ AsyncStorage integration for token persistence
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Network error detection
- ✅ Status code mapping (400, 401, 404, 429, 500, 502, 503, 504)
- ✅ Request/Response interceptors
- ✅ Generic HTTP methods (GET, POST, PUT, DELETE, PATCH)

**Error Handling:**
- 400: "Invalid request. Please check your input and try again."
- 401: "Your session has expired. Please log in again."
- 404: "The requested resource was not found."
- 429: "Too many attempts. Please wait a moment and try again."
- 500-503: "Server error. Please try again later."
- 504: "Request timeout. Please check your connection and try again."
- Network Error: "No internet connection. Please check your network and try again."

---

### 2. Complete Patient API Service (`src/services/api/patientApi.ts`)

**Implemented Endpoints:**

#### Authentication
1. **sendOTP(phoneNumber)**
   - POST `/api/otp/send`
   - Sends OTP to phone number
   - Returns: `{ message, success }`

2. **verifyOTP(phoneNumber, otpCode, departmentId?, doctorId?)**
   - POST `/api/otp/verify`
   - Verifies OTP and returns auth token
   - Auto-stores token in AsyncStorage
   - Returns: `{ message, token, user, success }`

#### Check-In
3. **checkInWithQR(data)**
   - POST `/api/checkin/qr`
   - Checks in patient with QR code
   - Parameters:
     - `phoneNumber` (required)
     - `qrCodeValue` (required)
     - `firstName` (optional)
     - `lastName` (optional)
     - `dateOfBirth` (optional)
     - `departmentId` (optional)
     - `doctorId` (optional)
   - Returns: Queue number, check-in ID, estimated wait time

4. **checkInWithQRData(qrData, phoneNumber)**
   - Alternative method accepting QRCodeData object
   - Simplifies QR code scanning implementation

#### Queue Management
5. **getQueueStatus()**
   - GET `/api/queue/status`
   - Returns current queue status
   - Includes waiting patients, estimated times, departments

#### Departments & Doctors
6. **getDepartments()**
   - GET `/api/departments`
   - Returns list of all departments

7. **getDoctors(departmentId?)**
   - GET `/api/doctors`
   - Optional filter by department

#### Additional Features
8. **getCheckInHistory(phoneNumber)** - Patient check-in history
9. **cancelCheckIn(checkInId)** - Cancel a check-in
10. **logout()** - Clear auth token
11. **isAuthenticated()** - Check auth status

---

### 3. Comprehensive TypeScript Types (`src/services/api/types.ts`)

**Type Categories:**
- ✅ Navigation types (RootStackParamList)
- ✅ User types
- ✅ OTP API types (SendOTPRequest, VerifyOTPRequest, Responses)
- ✅ Check-In API types (CheckInWithQRRequest, CheckInResponse)
- ✅ Queue types (QueueItem, QueueStatusResponse)
- ✅ Department & Doctor types
- ✅ QR Code types
- ✅ Generic API response types
- ✅ API Error types

**Key Features:**
- Support for both snake_case (backend) and camelCase (frontend)
- Normalized responses for consistency
- Optional fields properly typed
- Legacy support for backward compatibility

---

### 4. Error Messages Constants (`src/constants/apiErrors.ts`)

**Features:**
- ✅ Centralized error messages
- ✅ User-friendly descriptions
- ✅ `getErrorMessage(error)` helper function
- ✅ Automatic error mapping based on status codes

**Error Categories:**
- OTP errors (send failed, invalid, expired, rate limit)
- Check-in errors (failed, already exists, QR invalid/expired)
- Queue errors
- Network errors
- Server errors
- Generic errors

---

### 5. API Usage Documentation (`API_USAGE_GUIDE.md`)

**Contents:**
- Complete usage examples for all endpoints
- Error handling best practices
- TypeScript type imports
- Full check-in flow example
- Configuration instructions

---

## File Structure

```
src/
├── services/api/
│   ├── baseClient.ts          # Enhanced HTTP client
│   ├── patientApi.ts          # All API endpoints
│   ├── types.ts               # TypeScript interfaces
│   └── index.ts               # Clean exports
├── constants/
│   ├── apiErrors.ts           # Error messages
│   └── colors.ts              # UI constants
├── screens/
│   └── QRScanScreen.tsx       # Updated with new API
└── ...
```

---

## Configuration

### 1. Set API Base URL

Create `.env` file:
```env
EXPO_PUBLIC_API_URL=https://your-aws-url.com/api
```

### 2. Import and Use

```typescript
import patientApi from '@/services/api/patientApi';
import { getErrorMessage } from '@/constants/apiErrors';

// Send OTP
await patientApi.sendOTP('1234567890');

// Verify OTP
await patientApi.verifyOTP('1234567890', '123456');

// Check In
const response = await patientApi.checkInWithQR({
  phoneNumber: '1234567890',
  qrCodeValue: 'QR_CODE_STRING'
});
```

---

## What's Updated

### QRScanScreen.tsx
- ✅ Updated to use new API structure
- ✅ Proper phone number parameter
- ✅ Queue number and wait time display
- ✅ Better error handling
- ✅ Fixed API call signature

### Next Steps for Full Integration

1. **Add User Context/State Management**
   ```typescript
   // Store phone number after OTP verification
   // Pass to QR scanner
   ```

2. **Update PhoneInputScreen.tsx**
   ```typescript
   import patientApi from '@/services/api/patientApi';
   await patientApi.sendOTP(phoneNumber);
   ```

3. **Update OTPVerifyScreen.tsx**
   ```typescript
   const response = await patientApi.verifyOTP(phoneNumber, otp);
   // Store user data in state/context
   ```

4. **Update CheckInSuccessScreen.tsx**
   - Display queue number prominently
   - Show estimated wait time
   - Display department/doctor info

---

## API Response Examples

### Send OTP Response
```json
{
  "message": "OTP sent successfully",
  "success": true
}
```

### Verify OTP Response
```json
{
  "message": "Verification successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "user123",
    "phone_number": "1234567890",
    "first_name": "John",
    "last_name": "Doe"
  },
  "success": true
}
```

### Check-In Response
```json
{
  "success": true,
  "message": "Check-in successful",
  "checkInId": "checkin-123",
  "queueNumber": 42,
  "timestamp": "2024-01-15T10:30:00Z",
  "estimatedWaitTime": 25,
  "department": {
    "id": 1,
    "name": "Cardiology"
  },
  "doctor": {
    "id": 5,
    "name": "Dr. Smith"
  }
}
```

### Queue Status Response
```json
{
  "success": true,
  "current_queue": [
    {
      "id": "q1",
      "queue_number": 40,
      "patient_name": "John D.",
      "status": "waiting",
      "check_in_time": "2024-01-15T10:00:00Z",
      "estimated_wait_time": 15,
      "department": {
        "id": 1,
        "name": "Cardiology"
      }
    }
  ],
  "total_waiting": 10,
  "average_wait_time": 20
}
```

---

## Error Handling Example

```typescript
import { getErrorMessage } from '@/constants/apiErrors';

try {
  const response = await patientApi.checkInWithQR({
    phoneNumber,
    qrCodeValue
  });

  // Success
  navigation.replace('CheckInSuccess', {
    checkInId: response.checkInId!,
    timestamp: response.timestamp!,
    message: response.message
  });
} catch (error: any) {
  // Auto-formatted user-friendly message
  const message = getErrorMessage(error);
  Alert.alert('Error', message);

  // Can also check specific errors
  if (error.status === 429) {
    // Handle rate limiting
  } else if (error.isNetworkError) {
    // Handle network issues
  }
}
```

---

## Testing the API

### 1. Test OTP Flow
```typescript
// Phone: 1234567890
// Expected: OTP sent to phone

await patientApi.sendOTP('1234567890');
// Check phone for OTP code

await patientApi.verifyOTP('1234567890', 'XXXXXX');
// Should receive token and user data
```

### 2. Test QR Check-In
```typescript
const qrData = {
  qr_code_value: 'TEST_QR_123',
  timestamp: new Date().toISOString(),
  type: 'check-in',
  department_id: 1,
  doctor_id: 5
};

await patientApi.checkInWithQR({
  phoneNumber: '1234567890',
  qrCodeValue: qrData.qr_code_value,
  departmentId: qrData.department_id,
  doctorId: qrData.doctor_id
});
```

### 3. Test Queue Status
```typescript
const status = await patientApi.getQueueStatus();
console.log('Total Waiting:', status.total_waiting);
console.log('Avg Wait:', status.average_wait_time);
```

---

## Benefits

✅ **Type Safety** - Full TypeScript support throughout
✅ **Error Handling** - User-friendly messages for all error cases
✅ **Token Management** - Automatic storage and retrieval
✅ **Normalized Responses** - Consistent data format
✅ **Well Documented** - Comprehensive guides and examples
✅ **Scalable** - Easy to add new endpoints
✅ **Maintainable** - Clean separation of concerns
✅ **Production Ready** - Proper error handling and edge cases

---

## Support

For API integration help, refer to:
- `API_USAGE_GUIDE.md` - Complete usage examples
- `src/services/api/types.ts` - All TypeScript interfaces
- `src/constants/apiErrors.ts` - Error message mappings

## Notes

- All API calls are asynchronous (use `await` or `.then()`)
- Tokens persist across app restarts via AsyncStorage
- 401 errors automatically clear stored tokens
- Network errors are detected and handled separately
- All user-facing messages are production-ready
