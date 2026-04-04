# Patient Check-In App

A React Native mobile application for medical clinic check-in system built with Expo.

## Features

- **Role Selection**: Separate flows for patients and staff
- **Phone Authentication**: OTP-based authentication with country code support
- **QR Code Scanning**: Quick check-in using QR codes
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Clean and intuitive user interface

## Project Structure

```
patient-checkin-app/
├── screens/              # Screen components
│   ├── LandingScreen.tsx
│   ├── RoleSelectScreen.tsx
│   ├── PhoneInputScreen.tsx
│   ├── OTPVerifyScreen.tsx
│   └── QRScanScreen.tsx
├── components/           # Reusable components
├── navigation/           # Navigation configuration
│   └── AppNavigator.tsx
├── services/            # API and external services
│   └── api.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
└── App.tsx              # Main app component
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:
```
EXPO_PUBLIC_API_URL=http://your-backend-url/api
```

### Running the App

Start the development server:
```bash
npm start
```

Run on specific platform:
```bash
npm run ios      # Run on iOS
npm run android  # Run on Android
npm run web      # Run on web
```

## Dependencies

### Core Dependencies
- **React Native**: Mobile app framework
- **Expo**: Development platform
- **TypeScript**: Type safety

### Navigation
- **@react-navigation/native**: Navigation library
- **@react-navigation/native-stack**: Stack navigator
- **react-native-screens**: Native screen components
- **react-native-safe-area-context**: Safe area handling

### Functionality
- **expo-camera**: Camera access
- **expo-barcode-scanner**: QR code scanning
- **axios**: HTTP client for API calls

## API Integration

The app expects a backend API with the following endpoints:

### Authentication
- `POST /auth/send-otp`: Send OTP to phone number
  - Body: `{ phoneNumber, countryCode, role }`

- `POST /auth/verify-otp`: Verify OTP code
  - Body: `{ phoneNumber, countryCode, otp, role }`

### Check-In
- `POST /checkin/qr`: Check in using QR code
  - Body: `{ qrData }`

- `POST /checkin`: Manual check-in
  - Body: `{ patientId, appointmentId? }`

### Appointments
- `GET /appointments/patient/:patientId`: Get patient appointments

## Customization

### Styling
All styles are defined inline within each screen component. You can customize colors, fonts, and spacing by modifying the StyleSheet definitions.

### Country Codes
The phone input screen includes a built-in country picker with common countries. To add more countries, edit the `countries` array in `screens/PhoneInputScreen.tsx`.

### API Configuration
API service configuration is in `services/api.ts`. You can:
- Modify timeout settings
- Add custom headers
- Implement retry logic
- Add request/response interceptors

## Development

### Type Definitions
All TypeScript types are defined in `types/index.ts`. Update this file when:
- Adding new navigation screens
- Modifying API response structures
- Creating new data models

### Adding New Screens
1. Create screen component in `screens/`
2. Add route type to `RootStackParamList` in `types/index.ts`
3. Register screen in `navigation/AppNavigator.tsx`

## Permissions

The app requires the following permissions:
- **Camera**: For QR code scanning (requested at runtime)

## Troubleshooting

### QR Scanner Not Working
- Ensure camera permissions are granted
- Check if running on physical device (camera doesn't work in iOS simulator)

### API Calls Failing
- Verify API URL in `.env` file
- Check if backend server is running
- Review network logs in the console

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Expo cache: `expo start -c`

## License

This project is created for medical clinic check-in purposes.
