// src/screens/HomeScreen.js
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserData, claimDailyBonus } from '../store/slices/userSlice';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userId, username, level, xp, coins, status, lastDailyClaim } = useSelector((state) => state.user);
  const isLoading = status === 'loading';
  
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, userId]);
  
  const onRefresh = () => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  };
  
  const handleClaimDailyBonus = () => {
    if (userId) {
      dispatch(claimDailyBonus(userId));
    }
  };
  
  // Check if daily bonus is available
  const canClaimDaily = () => {
    if (!lastDailyClaim) return true;
    
    const lastClaim = new Date(lastDailyClaim);
    const now = new Date();
    
    // Check if last claim was more than 24 hours ago
    return (now - lastClaim) > (24 * 60 * 60 * 1000);
  };
  
  // Complete list of all certification options
  const allCertOptions = [
    // Main certifications
    { id: 'aplus',     name: 'A+ Core 1 (1101)',    color: '#6543CC', icon: 'desktop-outline',  primary: true,  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2 (1102)',    color: '#1ABC9C', icon: 'desktop-outline',  primary: false, screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+ (N10-009)',  color: '#FF4C8B', icon: 'wifi-outline',     primary: true,  screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+ (SY0-701)', color: '#2ECC71', icon: 'shield-checkmark-outline', primary: true,  screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+ (CS0-003)',     color: '#3498DB', icon: 'analytics-outline', primary: true,  screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+ (PT0-003)',  color: '#E67E22', icon: 'bug-outline',       primary: true,  screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+ (XK0-005)',    color: '#9B59B6', icon: 'terminal-outline',  primary: true,  screenName: 'LinuxPlusTests' },
    // Additional certifications
    { id: 'caspplus',  name: 'CASP+ (CAS-005)',     color: '#E74C3C', icon: 'shield-outline',    primary: false, screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+ (CV0-004)',    color: '#3498DB', icon: 'cloud-outline',     primary: false, screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+ (DA0-001)',     color: '#1ABC9C', icon: 'bar-chart-outline', primary: false, screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+ (SK0-005)',   color: '#9B59B6', icon: 'server-outline',    primary: false, screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',               color: '#34495E', icon: 'lock-closed-outline',primary: false,screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud Practitioner', color: '#F39C12', icon: 'cloud-outline',   primary: false, screenName: 'AWSCloudTests' },
  ];
  
  // Filter for primary certifications
  const primaryCertOptions = allCertOptions.filter(cert => cert.primary);
  // Filter for secondary certifications
  const secondaryCertOptions = allCertOptions.filter(cert => !cert.primary);
  
  // This function navigates to the correct stack screen + passes category param
  const navigateToTests = (cert) => {
    // e.g., { id: 'aplus', screenName: 'APlusTests', name: 'A+ Core 1 (1101)' }
    navigation.navigate('Tests', {
      screen: cert.screenName,  // e.g. 'APlusTests'
      params: {
        category: cert.id,      // e.g. 'aplus'
        title: cert.name,
      },
    });
  };
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {username}!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Level {level}</Text>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy-outline" size={16} color="#6543CC" />
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{xp} XP</Text>
            <View style={styles.statIconContainer}>
              <Ionicons name="flash-outline" size={16} color="#FF4C8B" />
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{coins}</Text>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={16} color="#2ECC71" />
            </View>
          </View>
        </View>
      </View>
      
      {/* Daily Bonus Card */}
      <TouchableOpacity
        style={styles.dailyBonusCard}
        onPress={() => navigation.navigate('DailyStation')}
      >
        <View style={styles.dailyBonusContent}>
          <Ionicons
            name={canClaimDaily() ? 'gift-outline' : 'calendar-outline'}
            size={24}
            color="#FFFFFF"
          />
          <View style={styles.dailyBonusTextContainer}>
            <Text style={styles.dailyBonusTitle}>
              {canClaimDaily() ? 'Daily Bonus Available!' : 'Daily Station'}
            </Text>
            <Text style={styles.dailyBonusSubtitle}>
              {canClaimDaily()
                ? 'Claim 250 coins and answer daily challenge'
                : 'Check daily challenge and return tomorrow for bonus'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Newsletter Card */}
      <TouchableOpacity
        style={styles.newsletterCard}
        onPress={() => navigation.navigate('Newsletter')}
      >
        <View style={styles.newsletterContent}>
          <Ionicons name="newspaper-outline" size={24} color="#FFFFFF" />
          <View style={styles.newsletterTextContainer}>
            <Text style={styles.newsletterTitle}>Daily Cyber Brief</Text>
            <Text style={styles.newsletterSubtitle}>
              Subscribe to our cybersecurity newsletter
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Primary certs */}
      <Text style={styles.sectionTitle}>Practice Tests</Text>
      <View style={styles.certGrid}>
        {primaryCertOptions.map((cert) => (
          <TouchableOpacity
            key={cert.id}
            style={[styles.certCard, { backgroundColor: cert.color }]}
            onPress={() => navigateToTests(cert)}
          >
            <Ionicons name={cert.icon} size={28} color="#FFFFFF" />
            <Text style={styles.certName}>{cert.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Secondary certs */}
      <Text style={styles.sectionTitle}>Other Practice Tests</Text>
      <View style={styles.certGrid}>
        {secondaryCertOptions.map((cert) => (
          <TouchableOpacity
            key={cert.id}
            style={[styles.certCard, { backgroundColor: cert.color }]}
            onPress={() => navigateToTests(cert)}
          >
            <Ionicons name={cert.icon} size={28} color="#FFFFFF" />
            <Text style={styles.certName}>{cert.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Training Tools</Text>
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => navigation.navigate('AnalogyHub')}
        >
          <Ionicons name="bulb-outline" size={24} color="#FF4C8B" />
          <View style={styles.toolTextContainer}>
            <Text style={styles.toolTitle}>Analogy Hub</Text>
            <Text style={styles.toolSubtitle}>Learn complex concepts with analogies</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => navigation.navigate('Resources')}
        >
          <Ionicons name="library-outline" size={24} color="#9B59B6" />
          <View style={styles.toolTextContainer}>
            <Text style={styles.toolTitle}>Resources Hub</Text>
            <Text style={styles.toolSubtitle}>Learning resources and tools</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => navigation.navigate('ScenarioSphere')}
        >
          <Ionicons name="document-text-outline" size={24} color="#2ECC71" />
          <View style={styles.toolTextContainer}>
            <Text style={styles.toolTitle}>Scenario Sphere</Text>
            <Text style={styles.toolSubtitle}>Practice with real-world scenarios</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => navigation.navigate('GRC')}
        >
          <Ionicons name="shield-outline" size={24} color="#3498DB" />
          <View style={styles.toolTextContainer}>
            <Text style={styles.toolTitle}>GRC Questions</Text>
            <Text style={styles.toolSubtitle}>Governance, Risk & Compliance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => navigation.navigate('XploitCraft')}
        >
          <Ionicons name="code-slash-outline" size={24} color="#E67E22" />
          <View style={styles.toolTextContainer}>
            <Text style={styles.toolTitle}>XploitCraft</Text>
            <Text style={styles.toolSubtitle}>Explore security exploit concepts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyBonusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6543CC',
    margin: 20,
    marginTop: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  dailyBonusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyBonusTextContainer: {
    marginLeft: 15,
  },
  dailyBonusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dailyBonusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  newsletterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF4C8B',
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  newsletterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsletterTextContainer: {
    marginLeft: 15,
  },
  newsletterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newsletterSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 20,
    marginBottom: 10,
  },
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  certCard: {
    width: '45%',
    height: 100,
    margin: '2.5%',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'space-between',
  },
  certName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  toolsContainer: {
    padding: 10,
    paddingBottom: 30,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  toolTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolSubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
  },
});

