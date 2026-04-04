import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../services/api/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type PatientQueueDisplayScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PatientQueueDisplay'>;
};

interface QueuePatient {
  id: string;
  name: string;
  queueNumber: number;
  checkInTime: string;
  estimatedWaitTime: number;
  status: 'waiting' | 'in-progress' | 'completed';
  department: string;
}

const PatientQueueDisplayScreen: React.FC<PatientQueueDisplayScreenProps> = ({
  navigation,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data - replace with API call later
  const [patients] = useState<QueuePatient[]>([
    {
      id: '1',
      name: 'John Doe',
      queueNumber: 1,
      checkInTime: '9:00 AM',
      estimatedWaitTime: 5,
      status: 'in-progress',
      department: 'General Medicine',
    },
    {
      id: '2',
      name: 'Jane Smith',
      queueNumber: 2,
      checkInTime: '9:15 AM',
      estimatedWaitTime: 15,
      status: 'waiting',
      department: 'General Medicine',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      queueNumber: 3,
      checkInTime: '9:30 AM',
      estimatedWaitTime: 25,
      status: 'waiting',
      department: 'General Medicine',
    },
    {
      id: '4',
      name: 'Alice Williams',
      queueNumber: 4,
      checkInTime: '9:45 AM',
      estimatedWaitTime: 35,
      status: 'waiting',
      department: 'General Medicine',
    },
    {
      id: '5',
      name: 'Charlie Brown',
      queueNumber: 5,
      checkInTime: '10:00 AM',
      estimatedWaitTime: 45,
      status: 'waiting',
      department: 'General Medicine',
    },
  ]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch queue data from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '#4CAF50';
      case 'waiting':
        return '#FFC107';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'waiting':
        return 'Waiting';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const renderPatientCard = ({ item }: { item: QueuePatient }) => (
    <View style={styles.patientCard}>
      <View style={styles.queueNumberContainer}>
        <Text style={styles.queueNumberLabel}>Queue #</Text>
        <Text style={styles.queueNumber}>{item.queueNumber}</Text>
      </View>

      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.department}>{item.department}</Text>

        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.timeText}>Check-in: {item.checkInTime}</Text>
        </View>

        <View style={styles.timeContainer}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.timeText}>
            Est. wait: {item.estimatedWaitTime} min
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
    </View>
  );

  const waitingCount = patients.filter((p) => p.status === 'waiting').length;
  const inProgressCount = patients.filter((p) => p.status === 'in-progress').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Patient Queue</Text>
          <Text style={styles.headerSubtitle}>
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{patients.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {inProgressCount}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FFC107' }]}>
            {waitingCount}
          </Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
      </View>

      {/* Queue List */}
      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-available" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No patients in queue</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  statsBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  listContainer: {
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  queueNumberContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  queueNumberLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  queueNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default PatientQueueDisplayScreen;
