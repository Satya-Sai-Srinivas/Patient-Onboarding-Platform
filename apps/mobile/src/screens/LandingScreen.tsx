import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../services/api/types';
import Svg, { Path, Polyline } from 'react-native-svg';

type LandingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Landing'>;
};

// Medical heartbeat line component
const HeartbeatLogo = () => (
  <Svg width="200" height="80" viewBox="0 0 200 80">
    <Polyline
      points="0,40 30,40 40,20 50,60 60,30 70,50 80,40 200,40"
      fill="none"
      stroke="#4A90E2"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Brand Section */}
        <View style={styles.logoSection}>
          <HeartbeatLogo />
          <Text style={styles.brandName}>BRAND NAME</Text>

          {/* Tagline Placeholder */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tagline Goes Here</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Get Start Button */}
        <TouchableOpacity
          style={styles.getStartButton}
          onPress={() => navigation.navigate('RoleSelect')}
        >
          <Text style={styles.getStartButtonText}>GET START</Text>
        </TouchableOpacity>

        {/* Bottom Text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LEARN MORE ABOUT ITI PRIMARY LAW
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    width: '100%',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 24,
  },
  taglineContainer: {
    backgroundColor: '#E8E8E8',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  getStartButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  getStartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 0.5,
  },
});

export default LandingScreen;
