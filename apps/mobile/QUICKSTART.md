# Quick Start Guide

## Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your backend API URL:
   ```
   EXPO_PUBLIC_API_URL=http://your-api-url/api
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on a device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## App Flow

1. **Landing Screen** → User sees welcome screen
2. **Role Selection** → User selects Patient or Staff role
3. **Phone Input** → User enters phone number with country code
4. **OTP Verification** → User enters 6-digit OTP code
5. **QR Scan** → User scans QR code to check in

## Backend API Requirements

Your backend should implement these endpoints:

### Send OTP
```
POST /auth/send-otp
Body: {
  "phoneNumber": "1234567890",
  "countryCode": "+1",
  "role": "patient"
}
Response: {
  "success": true,
  "message": "OTP sent successfully",
  "sessionId": "xxx"
}
```

### Verify OTP
```
POST /auth/verify-otp
Body: {
  "phoneNumber": "1234567890",
  "countryCode": "+1",
  "otp": "123456",
  "role": "patient"
}
Response: {
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "phoneNumber": "1234567890",
    "role": "patient"
  }
}
```

### Check-in with QR
```
POST /checkin/qr
Headers: { "Authorization": "Bearer jwt-token" }
Body: {
  "qrData": {
    "patientId": "xxx",
    "appointmentId": "yyy",
    "timestamp": "2024-01-01T00:00:00Z",
    "type": "check-in"
  }
}
Response: {
  "success": true,
  "message": "Checked in successfully",
  "checkInId": "checkin-id",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Testing Without Backend

You can test the UI without a backend by modifying `services/api.ts` to return mock data:

```typescript
async sendOTP(phoneNumber: string, countryCode: string, role: string) {
  // Mock response for testing
  return {
    success: true,
    message: 'OTP sent successfully',
    sessionId: 'mock-session-id'
  };
}
```

## QR Code Format

The app expects QR codes in this JSON format:

```json
{
  "patientId": "patient-123",
  "appointmentId": "appt-456",
  "timestamp": "2024-01-01T10:00:00Z",
  "type": "check-in"
}
```

You can generate test QR codes at: https://www.qr-code-generator.com/

## Common Issues

### Camera not working
- Grant camera permissions when prompted
- Camera doesn't work in iOS simulator - use a physical device

### API connection failed
- Check if backend is running
- Verify API URL in `.env` file
- Check network connectivity

### Metro bundler issues
- Clear cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Project Structure

```
├── screens/          # All screen components
├── components/       # Reusable UI components
├── navigation/       # Navigation configuration
├── services/         # API and external services
├── types/           # TypeScript type definitions
├── utils/           # Helper functions and constants
└── App.tsx          # Root component
```

## Next Steps

1. Implement your backend API
2. Test the complete flow
3. Customize the UI to match your brand
4. Add error logging and analytics
5. Set up push notifications (optional)
6. Deploy to app stores

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
