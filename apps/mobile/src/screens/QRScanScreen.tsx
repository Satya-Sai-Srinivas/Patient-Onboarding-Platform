import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, QRCodeData } from '../services/api/types';
import patientApi from '../services/api/patientApi';
import { getErrorMessage } from '../constants/apiErrors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import BarCodeScanner only on native platforms
let BarCodeScanner: any = null;
if (Platform.OS !== 'web') {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
}

type QRScanScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'QRScan'>;
  route: RouteProp<RootStackParamList, 'QRScan'>;
};

const QRScanScreen: React.FC<QRScanScreenProps> = ({ navigation, route }) => {
  const { role } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [userPhone, setUserPhone] = useState<string>('');
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Load user phone from AsyncStorage
    const loadUserPhone = async () => {
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) {
          setUserPhone(phone);
        }
      } catch (error) {
        console.error('Failed to load user phone:', error);
      }
    };

    loadUserPhone();

    if (!isWeb && BarCodeScanner) {
      (async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    } else if (isWeb) {
      // On web, skip camera permissions
      setHasPermission(true);
    }
  }, [isWeb]);

  const processQRData = async (data: string) => {
    if (isProcessing) return;

    // Stop scanning to prevent multiple scans
    setScanned(true);
    setIsProcessing(true);

    try {
      // Parse QR code data
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        throw new Error('Invalid QR code format. Please scan a valid check-in QR code.');
      }

      // Validate QR code data
      if (!qrData.qr_code_value || !qrData.timestamp || !qrData.type) {
        throw new Error('QR code is missing required information. Please scan a valid check-in QR code.');
      }

      // Get phone number from stored data
      const phoneToUse = userPhone;
      if (!phoneToUse) {
        throw new Error('Phone number not found. Please log in again.');
      }

      // Process check-in using API
      const response = await patientApi.checkInWithQR({
        phoneNumber: phoneToUse,
        qrCodeValue: qrData.qr_code_value,
        departmentId: qrData.department_id,
        doctorId: qrData.doctor_id,
      });

      // Store check-in data in AsyncStorage
      if (response.checkInId) {
        await AsyncStorage.setItem('check_in_id', response.checkInId);
      }
      if (response.queueNumber) {
        await AsyncStorage.setItem('queue_number', response.queueNumber.toString());
      }

      // Navigate to success screen with queue information
      navigation.replace('CheckInSuccess', {
        checkInId: response.checkInId || 'N/A',
        timestamp: response.timestamp || new Date().toISOString(),
        message: `${response.message}\n\nQueue Number: #${response.queueNumber || 'N/A'}${
          response.estimatedWaitTime
            ? `\nEstimated Wait: ${response.estimatedWaitTime} minutes`
            : ''
        }`,
      });
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert(
        'Check-In Failed',
        message,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: any) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    await processQRData(data);
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Please enter QR code data');
      return;
    }
    await processQRData(manualInput);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorMessage}>
            Please grant camera permission to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Same UI for both web and mobile
  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SCAN QR CODE</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Camera Scanner View */}
      <View style={styles.scannerContainer}>
        {/* Only show camera on mobile */}
        {!isWeb && BarCodeScanner && (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Web placeholder - gray background instead of camera */}
        {isWeb && (
          <View style={styles.webCameraPlaceholder} />
        )}

        {/* Overlay with Scanning Frame */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            {/* Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            {isWeb
              ? 'Camera not available on web - Use manual input below'
              : 'Please center the QR code on the scan box'}
          </Text>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Bottom Buttons */}
      <SafeAreaView style={styles.bottomSafeArea}>
        <View style={styles.bottomButtons}>
          {/* TODO: REMOVE THIS TEST BUTTON ONCE API IS READY */}
          {isWeb && (
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => {
                // Bypass to success screen for testing
                navigation.replace('CheckInSuccess', {
                  checkInId: 'TEST-12345',
                  timestamp: new Date().toISOString(),
                  message: 'Test check-in successful!\n\nQueue Number: #5\nEstimated Wait: 15 minutes',
                });
              }}
            >
              <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
              <Text style={styles.bottomButtonText}>Test Scan</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Coming Soon\n\nMy QR Code feature will be available soon.');
              } else {
                Alert.alert('Coming Soon', 'My QR Code feature will be available soon.');
              }
            }}
          >
            <MaterialIcons name="qr-code" size={28} color="#fff" />
            <Text style={styles.bottomButtonText}>My QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Coming Soon\n\nAlbum feature will be available soon.');
              } else {
                Alert.alert('Coming Soon', 'Album feature will be available soon.');
              }
            }}
          >
            <MaterialIcons name="photo-library" size={28} color="#fff" />
            <Text style={styles.bottomButtonText}>Album</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header styles
  headerSafeArea: {
    backgroundColor: '#4A90E2',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 40,
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#4A90E2',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  // Bottom buttons
  bottomSafeArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  // Web-specific styles
  webCameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  webHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 400,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  loader: {
    marginVertical: 20,
  },
  webButtonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  webCancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default QRScanScreen;
