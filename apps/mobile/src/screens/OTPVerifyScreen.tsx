import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../services/api/types';
import patientApi from '../services/api/patientApi';
import { getErrorMessage } from '../constants/apiErrors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OTPVerifyScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'OTPVerify'>;
  route: RouteProp<RootStackParamList, 'OTPVerify'>;
};

const OTP_LENGTH = 6;

// Format phone number for display
const formatPhoneDisplay = (phone: string, countryCode: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${countryCode} (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return `${countryCode} ${phone}`;
};

const OTPVerifyScreen: React.FC<OTPVerifyScreenProps> = ({
  navigation,
  route,
}) => {
  const { phoneNumber, countryCode, role } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, OTP_LENGTH).split('');
      setOtp(otpArray.concat(Array(OTP_LENGTH - otpArray.length).fill('')));
      if (inputRefs.current[OTP_LENGTH - 1]) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === OTP_LENGTH - 1 && value) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === OTP_LENGTH) {
        handleVerifyOTP(completeOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');

    if (otpToVerify.length !== OTP_LENGTH) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // Call verifyOTP API
      const response = await patientApi.verifyOTP(
        phoneNumber,
        otpToVerify
      );

      if (response.success) {
        await AsyncStorage.setItem('user_phone', phoneNumber);
        if (response.visit_id !== undefined) {
          await AsyncStorage.setItem('visit_id', String(response.visit_id));
        }
        if (response.ticket_id !== undefined) {
          await AsyncStorage.setItem('ticket_id', String(response.ticket_id));
        }
        if (response.queue_position !== undefined) {
          await AsyncStorage.setItem('queue_position', String(response.queue_position));
        }

        if (response.queue_position !== undefined) {
          navigation.replace('CheckInSuccess', {
            checkInId: response.ticket_id !== undefined ? String(response.ticket_id) : 'N/A',
            timestamp: new Date().toISOString(),
            message: `You're checked in! Queue Position: #${response.queue_position}${
              response.estimated_wait_time
                ? ` — Est. wait: ${response.estimated_wait_time} min`
                : ''
            }`,
          });
        } else {
          navigation.navigate('QRScan', { role });
        }
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP code. Please try again.');
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('Verification Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const response = await patientApi.sendOTP(phoneNumber);

      Alert.alert('Success', response.message || 'OTP sent successfully');
      setResendTimer(60); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear OTP inputs

      // Focus first input
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('Resend Failed', message);
      setResendTimer(0); // Allow retry immediately on error
    } finally {
      setIsLoading(false);
    }
  };

  const formattedPhone = formatPhoneDisplay(phoneNumber, countryCode);

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Instruction Text */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Enter code sent to
          </Text>
          <Text style={styles.phoneText}>{formattedPhone}</Text>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Resend Code Link with Countdown */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendOTP}
          disabled={resendTimer > 0 || isLoading}
        >
          <Text
            style={[
              styles.resendText,
              resendTimer === 0 && !isLoading && styles.resendTextActive,
            ]}
          >
            {resendTimer > 0
              ? `Resend Code (${resendTimer}s)`
              : 'Resend Code'}
          </Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (isLoading || otp.join('').length !== OTP_LENGTH) && styles.verifyButtonDisabled,
          ]}
          onPress={() => handleVerifyOTP()}
          disabled={isLoading || otp.join('').length !== OTP_LENGTH}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#F5F5F5',
    color: '#1a1a1a',
  },
  otpInputFilled: {
    borderColor: '#4A90E2',
    backgroundColor: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#999',
  },
  resendTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OTPVerifyScreen;
