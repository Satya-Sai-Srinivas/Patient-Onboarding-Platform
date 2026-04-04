// ============================================================================
// Navigation Types
// ============================================================================
export type RootStackParamList = {
  Landing: undefined;
  RoleSelect: undefined;
  PhoneInput: { role: 'patient' | 'staff' };
  OTPVerify: { phoneNumber: string; countryCode: string; role: 'patient' | 'staff' };
  QRScan: { role: 'patient' | 'staff' };
  CheckInSuccess: { checkInId: string; timestamp: string; message?: string };
  PatientQueueDisplay: undefined;
};

// ============================================================================
// User Types
// ============================================================================
export interface User {
  id: string;
  phoneNumber: string;
  countryCode: string;
  role: 'patient' | 'staff';
  name?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

// ============================================================================
// OTP API Types
// ============================================================================
export interface SendOTPRequest {
  phone_number: string;
}

export interface SendOTPResponse {
  message: string;
  otp_id: number;
  expires_at: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
  department_id?: number;
  doctor_id?: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  patient_id?: number;
  visit_id?: number;
  ticket_id?: number;
  queue_position?: number;
  estimated_wait_time?: number;
}

// ============================================================================
// Check-In API Types
// ============================================================================
export interface CheckInWithQRRequest {
  phone_number: string;
  qr_code_value: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  department_id?: number;
  doctor_id?: number;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  patient_id: number;
  visit_id: number;
  ticket_id: number;
  queue_position: number;
}

// ============================================================================
// Queue Status API Types
// ============================================================================
export interface QueueItem {
  id: string;
  queue_number: number;
  patient_name?: string;
  status: 'waiting' | 'called' | 'in_progress' | 'completed';
  check_in_time: string;
  estimated_wait_time?: number;
  department?: {
    id: number;
    name: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
}

export interface QueueStatusResponse {
  success: boolean;
  date: string;
  timestamp: string;
  current_queue: number;
  status_breakdown: {
    WAITING: number;
    CALLED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
}

// ============================================================================
// Department & Doctor Types
// ============================================================================
export interface Department {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  department_id: number;
  specialization?: string;
  active: boolean;
}

export interface GetDepartmentsResponse {
  success: boolean;
  departments: Department[];
}

export interface GetDoctorsResponse {
  success: boolean;
  doctors: Doctor[];
}

// ============================================================================
// QR Code Types
// ============================================================================
export interface QRCodeData {
  qr_code_value: string;
  patientId?: string;
  patient_id?: string;
  appointmentId?: string;
  appointment_id?: string;
  timestamp: string;
  type: 'check-in' | 'appointment';
  department_id?: number;
  doctor_id?: number;
}

// ============================================================================
// Generic API Response Types
// ============================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
  serverMessage?: string;
  isNetworkError?: boolean;
}

// ============================================================================
// Patient Types (Legacy - for backward compatibility)
// ============================================================================
export interface OTPResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifyOTPResponseLegacy {
  success: boolean;
  token: string;
  user: User;
}
