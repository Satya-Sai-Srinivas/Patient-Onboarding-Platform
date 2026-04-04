import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../services/api/types';
import patientApi from '../services/api/patientApi';
import { getErrorMessage } from '../constants/apiErrors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type PhoneInputScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PhoneInput'>;
  route: RouteProp<RootStackParamList, 'PhoneInput'>;
};

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
];

// Phone number formatting function
const formatPhoneNumber = (text: string): string => {
  // Remove all non-digit characters
  const cleaned = text.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = cleaned.substring(0, 10);

  // Format as (XXX) XXX-XXXX
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Get raw phone number (remove formatting)
const getRawPhoneNumber = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({
  navigation,
  route,
}) => {
  const { role } = route.params;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [verifyTimer, setVerifyTimer] = useState(0);

  // Helper function for cross-platform alerts
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    if (verifyTimer > 0) {
      const timer = setInterval(() => {
        setVerifyTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifyTimer]);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const isValidPhone = () => {
    const raw = getRawPhoneNumber(phoneNumber);
    return raw.length === 10;
  };

  const handleVerifyClick = () => {
    if (verifyTimer > 0) return;

    const rawPhone = getRawPhoneNumber(phoneNumber);

    if (rawPhone.length === 0) {
      showAlert('Phone Number Required', 'Please enter your phone number');
      return;
    }

    if (rawPhone.length !== 10) {
      showAlert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    sendOTP(rawPhone);
  };

  const sendOTP = async (rawPhone: string) => {
    setIsLoading(true);
    try {
      const response = await patientApi.sendOTP(rawPhone);

      showAlert('Success', response.message || 'OTP sent successfully');
      setVerifyTimer(60); // Start 60 second countdown
    } catch (error: any) {
      if (error.status === 429) {
        showAlert('Too Many Attempts', 'Too many attempts. Please try again later.');
      } else {
        const message = getErrorMessage(error);
        showAlert('Error', message);
      }
      setVerifyTimer(0); // Allow retry immediately on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      showAlert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!agreedToTerms) {
      showAlert('Terms Required', 'Please accept the user agreement and privacy policy to continue');
      return;
    }

    setIsLoading(true);
    try {
      const rawPhone = getRawPhoneNumber(phoneNumber);
      const response = await patientApi.sendOTP(rawPhone);

      showAlert('Success', response.message || 'OTP sent successfully');
      navigation.navigate('OTPVerify', {
        phoneNumber: rawPhone,
        countryCode: selectedCountry.dialCode,
        role,
      });
    } catch (error: any) {
      if (error.status === 429) {
        showAlert('Too Many Attempts', 'Too many attempts. Please try again later.');
      } else {
        const message = getErrorMessage(error);
        showAlert('Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Log In / Sign Up</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Country Code Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Country Code</Text>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Phone Number Input */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="(555) 555-5555"
              keyboardType="numeric"
              maxLength={14}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.verifyButton,
                verifyTimer > 0 && styles.verifyButtonDisabled
              ]}
              onPress={handleVerifyClick}
              disabled={verifyTimer > 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>
                  {verifyTimer > 0 ? `${verifyTimer}s` : 'Get Verify code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Log In Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            (!isValidPhone() || isLoading) && styles.loginButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={!isValidPhone() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Problems Link */}
        <TouchableOpacity
          style={styles.problemsLink}
          onPress={() => showAlert('Help', 'Please contact support for assistance.')}
        >
          <Text style={styles.problemsLinkText}>Problems Happen?</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* User Agreement Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && (
              <MaterialIcons name="check" size={18} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text
              style={styles.linkText}
              onPress={() => showAlert('User Agreement', 'User agreement details...')}
            >
              User Agreement
            </Text>
            {' and '}
            <Text
              style={styles.linkText}
              onPress={() => showAlert('Privacy Policy', 'Privacy policy details...')}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  sectionContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  flag: {
    fontSize: 24,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  verifyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  problemsLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  problemsLinkText: {
    color: '#4A90E2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  linkText: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  countryDialCode: {
    fontSize: 14,
    color: '#666',
  },
});

export default PhoneInputScreen;
