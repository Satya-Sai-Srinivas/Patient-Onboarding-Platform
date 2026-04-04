# API Usage Guide

## Overview

This guide explains how to use the Patient API service layer for the healthcare queue management system.

## Configuration

### Setting the API Base URL

The API base URL is configured via environment variable. Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://your-aws-url.com/api
```

Default URL (development): `http://localhost:3000/api`

## Import the API Service

```typescript
import patientApi from '@/services/api/patientApi';
import { getErrorMessage } from '@/constants/apiErrors';
```

## API Methods

### 1. Send OTP

Send an OTP code to a phone number for verification.

```typescript
try {
  const response = await patientApi.sendOTP('1234567890');
  console.log(response.message); // "OTP sent successfully"
} catch (error) {
  const message = getErrorMessage(error);
  Alert.alert('Error', message);
}
```

**Request:**
- `phoneNumber`: string (without country code)

**Response:**
```typescript
{
  message: string;
  success?: boolean;
}
```

**Possible Errors:**
- 400: Invalid phone number
- 429: Too many requests (rate limited)
- 500: Server error

---

### 2. Verify OTP

Verify the OTP code and receive an authentication token.

```typescript
try {
  const response = await patientApi.verifyOTP(
    '1234567890',  // phone number
    '123456',      // OTP code
    1,             // department ID (optional)
    5              // doctor ID (optional)
  );

  // Token is automatically stored
  console.log('Verified:', response.user);

  // Navigate to next screen
  navigation.navigate('QRScan');
} catch (error) {
  const message = getErrorMessage(error);
  Alert.alert('Error', message);
}
```

**Request:**
- `phoneNumber`: string
- `otpCode`: string (6 digits)
- `departmentId?`: number (optional)
- `doctorId?`: number (optional)

**Response:**
```typescript
{
  message: string;
  token?: string;
  user?: {
    id: string;
    phone_number: string;
    first_name?: string;
    last_name?: string;
  };
  success?: boolean;
}
```

**Possible Errors:**
- 400: Invalid OTP or phone number
- 404: OTP not found or expired
- 429: Too many verification attempts
- 500: Server error

---

### 3. Check In with QR Code

Check in a patient using a QR code.

```typescript
try {
  const response = await patientApi.checkInWithQR({
    phoneNumber: '1234567890',
    qrCodeValue: 'QR_CODE_STRING',
    firstName: 'John',        // optional
    lastName: 'Doe',          // optional
    dateOfBirth: '1990-01-01',// optional
    departmentId: 1,          // optional
    doctorId: 5               // optional
  });

  console.log('Queue Number:', response.queueNumber);
  console.log('Estimated Wait:', response.estimatedWaitTime, 'minutes');

  // Navigate to success screen
  navigation.replace('CheckInSuccess', {
    checkInId: response.checkInId!,
    timestamp: response.timestamp!,
    message: response.message
  });
} catch (error) {
  const message = getErrorMessage(error);
  Alert.alert('Error', message);
}
```

**Request:**
```typescript
{
  phoneNumber: string;
  qrCodeValue: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;  // Format: YYYY-MM-DD
  departmentId?: number;
  doctorId?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  checkInId: string;
  queueNumber: number;
  timestamp: string;
  estimatedWaitTime?: number;  // in minutes
  department?: {
    id: number;
    name: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
}
```

**Possible Errors:**
- 400: Invalid request data
- 404: QR code not found or invalid
- 409: Already checked in
- 500: Server error

---

### 4. Alternative: Check In with QR Data Object

If you have a parsed QRCodeData object:

```typescript
const qrData: QRCodeData = JSON.parse(scannedData);

const response = await patientApi.checkInWithQRData(
  qrData,
  '1234567890' // phone number
);
```

---

### 5. Get Queue Status

Get the current queue status and waiting times.

```typescript
try {
  const response = await patientApi.getQueueStatus();

  console.log('Total Waiting:', response.total_waiting);
  console.log('Average Wait Time:', response.average_wait_time, 'minutes');

  response.current_queue.forEach(item => {
    console.log(`Queue #${item.queue_number}: ${item.patient_name}`);
  });
} catch (error) {
  const message = getErrorMessage(error);
  Alert.alert('Error', message);
}
```

**Response:**
```typescript
{
  success: boolean;
  current_queue: QueueItem[];
  total_waiting: number;
  average_wait_time?: number;
  departments?: Array<{
    id: number;
    name: string;
    queue_count: number;
  }>;
}
```

---

### 6. Get Departments

Fetch list of all departments.

```typescript
const response = await patientApi.getDepartments();
console.log('Departments:', response.departments);
```

---

### 7. Get Doctors

Fetch list of doctors, optionally filtered by department.

```typescript
// All doctors
const allDoctors = await patientApi.getDoctors();

// Doctors in specific department
const deptDoctors = await patientApi.getDoctors(1);
```

---

### 8. Get Check-In History

Get check-in history for a patient.

```typescript
const history = await patientApi.getCheckInHistory('1234567890');
```

---

### 9. Cancel Check-In

Cancel a check-in.

```typescript
const response = await patientApi.cancelCheckIn('checkin-123');
console.log(response.message);
```

---

### 10. Authentication

#### Check if authenticated
```typescript
const isAuth = patientApi.isAuthenticated();
```

#### Logout
```typescript
await patientApi.logout();
navigation.reset({
  index: 0,
  routes: [{ name: 'Landing' }],
});
```

## Error Handling Best Practices

### Using getErrorMessage Helper

```typescript
import { getErrorMessage } from '@/constants/apiErrors';

try {
  await patientApi.sendOTP(phoneNumber);
} catch (error) {
  const userMessage = getErrorMessage(error);
  Alert.alert('Error', userMessage);
}
```

### Handling Specific Error Cases

```typescript
try {
  await patientApi.verifyOTP(phone, otp);
} catch (error: any) {
  if (error.status === 429) {
    // Rate limited
    Alert.alert('Too Many Attempts', 'Please wait before trying again.');
  } else if (error.status === 404) {
    // OTP expired
    Alert.alert('OTP Expired', 'Please request a new OTP.');
  } else {
    Alert.alert('Error', getErrorMessage(error));
  }
}
```

### Network Error Detection

```typescript
try {
  await patientApi.getQueueStatus();
} catch (error: any) {
  if (error.isNetworkError) {
    Alert.alert(
      'No Internet',
      'Please check your connection and try again.'
    );
  } else {
    Alert.alert('Error', getErrorMessage(error));
  }
}
```

## Complete Example: Check-In Flow

```typescript
import React, { useState } from 'react';
import patientApi from '@/services/api/patientApi';
import { getErrorMessage } from '@/constants/apiErrors';

const CheckInFlow = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await patientApi.sendOTP(phone);
      Alert.alert('Success', response.message);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      await patientApi.verifyOTP(phone, otp);
      navigation.navigate('QRScan');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Check In with QR
  const handleCheckIn = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await patientApi.checkInWithQR({
        phoneNumber: phone,
        qrCodeValue: qrCode,
      });

      navigation.replace('CheckInSuccess', {
        checkInId: response.checkInId!,
        timestamp: response.timestamp!,
        message: `Queue Number: ${response.queueNumber}`,
      });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ... render UI
};
```

## TypeScript Types

All types are exported from `@/services/api/types`:

```typescript
import type {
  SendOTPResponse,
  VerifyOTPResponse,
  CheckInResponse,
  QueueStatusResponse,
  QRCodeData,
  Department,
  Doctor,
} from '@/services/api/types';
```

## Notes

- All API methods use the baseClient which handles authentication tokens automatically
- Tokens are stored in AsyncStorage and persist across app restarts
- The API automatically adds the `Authorization: Bearer <token>` header to authenticated requests
- 401 errors automatically clear the stored token
- All errors are user-friendly and can be displayed directly to users
