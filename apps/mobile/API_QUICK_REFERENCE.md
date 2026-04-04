# API Quick Reference

## Import Statement
```typescript
import patientApi from '@/services/api/patientApi';
import { getErrorMessage } from '@/constants/apiErrors';
```

## Quick Methods

### 1. Send OTP
```typescript
await patientApi.sendOTP('1234567890');
```

### 2. Verify OTP
```typescript
const result = await patientApi.verifyOTP('1234567890', '123456', departmentId?, doctorId?);
// Token automatically stored
```

### 3. Check In with QR
```typescript
const response = await patientApi.checkInWithQR({
  phoneNumber: '1234567890',
  qrCodeValue: 'QR_CODE_STRING',
  firstName?: 'John',
  lastName?: 'Doe',
  dateOfBirth?: '1990-01-01',
  departmentId?: 1,
  doctorId?: 5
});

// Response includes:
// - checkInId
// - queueNumber
// - estimatedWaitTime
// - department
// - doctor
```

### 4. Get Queue Status
```typescript
const queue = await patientApi.getQueueStatus();
// Returns: current_queue[], total_waiting, average_wait_time
```

### 5. Get Departments
```typescript
const depts = await patientApi.getDepartments();
```

### 6. Get Doctors
```typescript
const doctors = await patientApi.getDoctors(departmentId?);
```

### 7. Logout
```typescript
await patientApi.logout();
```

### 8. Check Auth
```typescript
const isAuth = patientApi.isAuthenticated();
```

## Error Handling Template
```typescript
try {
  const response = await patientApi.METHOD_NAME(params);
  // Success handling
} catch (error) {
  Alert.alert('Error', getErrorMessage(error));
}
```

## Common Error Codes
- **400**: Invalid input → Check your request data
- **401**: Unauthorized → Token expired, re-authenticate
- **404**: Not found → Resource doesn't exist
- **429**: Rate limited → Too many requests, wait
- **500-503**: Server error → Try again later

## Environment Setup
```env
# .env file
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
```

## Response Format Examples

### OTP Send
```json
{ "message": "OTP sent successfully", "success": true }
```

### OTP Verify
```json
{
  "message": "Verification successful",
  "token": "eyJhbG...",
  "user": { "id": "123", "phone_number": "1234567890" }
}
```

### Check-In
```json
{
  "success": true,
  "checkInId": "abc123",
  "queueNumber": 42,
  "estimatedWaitTime": 25,
  "department": { "id": 1, "name": "Cardiology" },
  "doctor": { "id": 5, "name": "Dr. Smith" }
}
```

## Pro Tips
✅ Always use `getErrorMessage(error)` for user-friendly messages
✅ Token is auto-stored after successful OTP verification
✅ All methods return Promises - use async/await
✅ Check `patientApi.isAuthenticated()` before protected calls
✅ Network errors are detected automatically
✅ Responses are normalized (snake_case → camelCase)
