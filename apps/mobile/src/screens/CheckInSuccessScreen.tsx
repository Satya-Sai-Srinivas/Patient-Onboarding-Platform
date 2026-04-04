import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../services/api/types';
import patientApi from '../services/api/patientApi';
import { getErrorMessage } from '../constants/apiErrors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CheckInSuccessScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CheckInSuccess'>;
  route: RouteProp<RootStackParamList, 'CheckInSuccess'>;
};

const CheckInSuccessScreen: React.FC<CheckInSuccessScreenProps> = ({
  navigation,
  route,
}) => {
  const { checkInId, timestamp, message } = route.params;

  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
  const [ticketId, setTicketId] = useState<string>('');
  const [visitId, setVisitId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load data from AsyncStorage
    const loadStoredData = async () => {
      try {
        const [storedQueuePos, storedTicket, storedVisit] = await Promise.all([
          AsyncStorage.getItem('queue_position'),
          AsyncStorage.getItem('ticket_id'),
          AsyncStorage.getItem('visit_id'),
        ]);

        if (storedQueuePos) setQueuePosition(parseInt(storedQueuePos));
        if (storedTicket) setTicketId(storedTicket);
        if (storedVisit) setVisitId(storedVisit);
      } catch (error) {
        console.error('Failed to load stored data:', error);
      }
    };

    loadStoredData();

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshQueueStatus();
    }, 30000); // 30 seconds

    // Initial fetch
    refreshQueueStatus();

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const refreshQueueStatus = async () => {
    try {
      setIsRefreshing(true);
      const response = await patientApi.getQueueStatus();

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh queue status:', error);
      // Don't show error to user for auto-refresh failures
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewQueueStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await patientApi.getQueueStatus();

      // Format queue information
      const queueInfo = `Waiting: ${response.status_breakdown.WAITING}\nIn Progress: ${response.status_breakdown.IN_PROGRESS}\nActive in Queue: ${response.current_queue} patients`;

      Alert.alert('Queue Status', queueInfo);

      setLastUpdated(new Date());
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('Error', message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDone = () => {
    // Clear the refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Navigate back to the beginning
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Checkmark Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={100} color="#34C759" />
        </View>

        {/* Heading */}
        <Text style={styles.title}>Check-in Successful!</Text>

        {/* Display Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Your Queue Information</Text>
            {isRefreshing && (
              <ActivityIndicator size="small" color="#4A90E2" />
            )}
          </View>

          {/* Queue Position */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="people" size={24} color="#4A90E2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Queue Position</Text>
              <Text style={styles.infoValue}>
                #{queuePosition !== null ? queuePosition : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Estimated Wait Time */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time" size={24} color="#4A90E2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estimated Wait Time</Text>
              <Text style={styles.infoValue}>
                {estimatedWaitTime !== null ? `${estimatedWaitTime} minutes` : 'Calculating...'}
              </Text>
            </View>
          </View>

          {/* Ticket Number */}
          {ticketId && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="confirmation-number" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ticket Number</Text>
                <Text style={styles.infoValue}>{ticketId}</Text>
              </View>
            </View>
          )}

          {/* Visit ID */}
          {visitId && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="badge" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Your Visit ID</Text>
                <Text style={styles.infoValue}>{visitId}</Text>
              </View>
            </View>
          )}

          {/* Last Updated */}
          <Text style={styles.lastUpdatedText}>
            Updated {formatLastUpdated()}
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#4A90E2" />
          <Text style={styles.infoText}>
            Please have a seat in the waiting area. You'll be called when it's your turn.
          </Text>
        </View>

        {/* View Queue Status Button */}
        <TouchableOpacity
          style={styles.viewQueueButton}
          onPress={handleViewQueueStatus}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.viewQueueButtonText}>View Queue Status</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    marginLeft: 12,
  },
  viewQueueButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  viewQueueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  doneButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  doneButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckInSuccessScreen;
