/**
 * Validation utility functions
 */

/**
 * Validate phone number format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Check if the number has at least 10 digits and no more than 15
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Validate OTP code format
 * @param otp - OTP code to validate
 * @returns true if valid, false otherwise
 */
export const isValidOTP = (otp: string): boolean => {
  // Check if OTP is exactly 6 digits
  return /^\d{6}$/.test(otp);
};

/**
 * Format phone number for display
 * @param phoneNumber - Raw phone number
 * @param countryCode - Country code
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: string
): string => {
  return `${countryCode} ${phoneNumber}`;
};

/**
 * Parse QR code data
 * @param qrString - QR code string data
 * @returns Parsed QR code object or null if invalid
 */
export const parseQRCode = (qrString: string): any => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    console.error('Invalid QR code format:', error);
    return null;
  }
};

/**
 * Validate QR code structure
 * @param qrData - Parsed QR code data
 * @returns true if valid, false otherwise
 */
export const isValidQRCode = (qrData: any): boolean => {
  if (!qrData || typeof qrData !== 'object') {
    return false;
  }

  // Check required fields
  return (
    qrData.timestamp &&
    qrData.type &&
    (qrData.type === 'check-in' || qrData.type === 'appointment')
  );
};
