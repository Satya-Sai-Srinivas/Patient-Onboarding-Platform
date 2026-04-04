import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../services/api/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type RoleSelectScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelect'>;
};

const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({ navigation }) => {
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePatient = () => {
    navigation.navigate('PhoneInput', { role: 'patient' });
  };

  const handlePatientQueueDisplay = () => {
    navigation.navigate('PatientQueueDisplay');
  };

  const handleComingSoon = (role: string) => {
    showAlert('Coming Soon', `${role} functionality will be available soon.`);
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Role Selection</Text>
          <Text style={styles.headerSubtitle}>Tagline Lines</Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Patient Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={handlePatient}
        >
          <Ionicons name="person" size={28} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Patient</Text>
        </TouchableOpacity>

        {/* Doctor Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleComingSoon('Doctor')}
        >
          <MaterialCommunityIcons name="stethoscope" size={28} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Doctor</Text>
        </TouchableOpacity>

        {/* Admin Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleComingSoon('Admin')}
        >
          <Ionicons name="clipboard" size={28} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Admin</Text>
        </TouchableOpacity>

        {/* Patient Queue Display Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={handlePatientQueueDisplay}
        >
          <MaterialCommunityIcons name="monitor-dashboard" size={28} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Patient Queue Display</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  roleButton: {
    backgroundColor: '#4A90E2',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleSelectScreen;
