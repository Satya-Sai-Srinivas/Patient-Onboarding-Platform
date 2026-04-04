import baseClient from './baseClient';
import {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  CheckInWithQRRequest,
  CheckInResponse,
  QueueStatusResponse,
  GetDepartmentsResponse,
  GetDoctorsResponse,
  QRCodeData,
} from './types';

/**
 * Patient API Service
 * Handles all patient-related API calls for the healthcare queue management system
 */
class PatientApi {
  /**
   * Send OTP to a phone number
   * @param phoneNumber - Phone number to send OTP to (format: without country code)
   * @returns Promise with send OTP response
   *
   * Possible errors:
   * - 400: Invalid phone number format
   * - 429: Too many OTP requests (rate limited)
   * - 500: Server error
   */
  async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    try {
      const request: SendOTPRequest = {
        phone_number: phoneNumber,
      };

      const response = await baseClient.post<SendOTPResponse>('/otp/send', request);
      return response;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   * @param phoneNumber - Phone number that received the OTP
   * @param otpCode - 6-digit OTP code
   * @param departmentId - Optional department ID
   * @param doctorId - Optional doctor ID
   * @returns Promise with verification response including auth token
   *
   * Possible errors:
   * - 400: Invalid OTP code or phone number
   * - 404: OTP not found or expired
   * - 429: Too many verification attempts
   * - 500: Server error
   */
  async verifyOTP(
    phoneNumber: string,
    otpCode: string,
    departmentId?: number,
    doctorId?: number
  ): Promise<VerifyOTPResponse> {
    try {
      const request: VerifyOTPRequest = {
        phone_number: phoneNumber,
        otp_code: otpCode,
      };

      if (departmentId) {
        request.department_id = departmentId;
      }

      if (doctorId) {
        request.doctor_id = doctorId;
      }

      const response = await baseClient.post<VerifyOTPResponse>(
        '/otp/verify',
        request
      );

      // Store auth token if provided
      if (response.token) {
        await baseClient.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Check in patient using QR code
   * @param data - Check-in data including phone number and QR code
   * @returns Promise with check-in response including queue number
   *
   * Possible errors:
   * - 400: Invalid request data
   * - 404: QR code not found or invalid
   * - 409: Already checked in
   * - 500: Server error
   */
  async checkInWithQR(data: {
    phoneNumber: string;
    qrCodeValue: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    departmentId?: number;
    doctorId?: number;
  }): Promise<CheckInResponse> {
    try {
      const request: CheckInWithQRRequest = {
        phone_number: data.phoneNumber,
        qr_code_value: data.qrCodeValue,
      };

      if (data.firstName) request.first_name = data.firstName;
      if (data.lastName) request.last_name = data.lastName;
      if (data.dateOfBirth) request.date_of_birth = data.dateOfBirth;
      if (data.departmentId) request.department_id = data.departmentId;
      if (data.doctorId) request.doctor_id = data.doctorId;

      const response = await baseClient.post<CheckInResponse>(
        '/checkin/qr',
        request
      );

      // Normalize response for consistency
      return response;
    } catch (error) {
      console.error('Error checking in with QR:', error);
      throw error;
    }
  }

  /**
   * Check in patient with QR code data object
   * Alternative method that accepts QRCodeData directly
   */
  async checkInWithQRData(qrData: QRCodeData, phoneNumber: string): Promise<CheckInResponse> {
    return this.checkInWithQR({
      phoneNumber,
      qrCodeValue: qrData.qr_code_value,
      departmentId: qrData.department_id,
      doctorId: qrData.doctor_id,
    });
  }

  /**
   * Get current queue status
   * @returns Promise with queue status including waiting patients and estimated wait times
   *
   * Possible errors:
   * - 401: Unauthorized (token expired)
   * - 500: Server error
   */
  async getQueueStatus(): Promise<QueueStatusResponse> {
    try {
      const response = await baseClient.get<QueueStatusResponse>('/queue/status');
      return response;
    } catch (error) {
      console.error('Error fetching queue status:', error);
      throw error;
    }
  }

  /**
   * Get list of all departments
   * @returns Promise with departments list
   */
  async getDepartments(): Promise<GetDepartmentsResponse> {
    try {
      const response = await baseClient.get<GetDepartmentsResponse>('/departments');
      return response;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  /**
   * Get list of doctors, optionally filtered by department
   * @param departmentId - Optional department ID to filter doctors
   * @returns Promise with doctors list
   */
  async getDoctors(departmentId?: number): Promise<GetDoctorsResponse> {
    try {
      const url = departmentId
        ? `/doctors?department_id=${departmentId}`
        : '/doctors';

      const response = await baseClient.get<GetDoctorsResponse>(url);
      return response;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  /**
   * Get patient check-in history
   * @param phoneNumber - Patient's phone number
   * @returns Promise with check-in history
   */
  async getCheckInHistory(phoneNumber: string): Promise<any> {
    try {
      const response = await baseClient.get(`/checkin/history/${phoneNumber}`);
      return response;
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      throw error;
    }
  }

  /**
   * Cancel a check-in
   * @param checkInId - Check-in ID to cancel
   * @returns Promise with cancellation response
   */
  async cancelCheckIn(checkInId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await baseClient.post(`/checkin/${checkInId}/cancel`);
      return response;
    } catch (error) {
      console.error('Error cancelling check-in:', error);
      throw error;
    }
  }

  /**
   * Logout - clear auth token
   */
  async logout(): Promise<void> {
    await baseClient.clearAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return baseClient.getAuthToken() !== null;
  }
}

// Export a singleton instance
export default new PatientApi();
