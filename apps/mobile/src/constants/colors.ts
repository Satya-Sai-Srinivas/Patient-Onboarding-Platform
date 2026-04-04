/**
 * App-wide constants
 */

// Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#666',
  textLight: '#999',
  border: '#e9ecef',
  inputBackground: '#f8f9fa',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Typography
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

// OTP Configuration
export const OTP_LENGTH = 6;
export const OTP_RESEND_TIMEOUT = 60; // seconds

// API Configuration
export const API_TIMEOUT = 10000; // milliseconds

// QR Code Types
export const QR_CODE_TYPES = {
  CHECK_IN: 'check-in',
  APPOINTMENT: 'appointment',
} as const;

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  STAFF: 'staff',
} as const;
