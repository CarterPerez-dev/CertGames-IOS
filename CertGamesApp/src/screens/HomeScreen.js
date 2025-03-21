// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchUserData, claimDailyBonus } from '../store/slices/userSlice';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userId, username, level, xp, coins, status, lastDailyClaim } = useSelector((state) => state.user);
  const isLoading = status === 'loading';
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, userId]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await dispatch(fetchUserData(userId));
    }
    setRefreshing(false);
  };

  // Apply haptic feedback on button press
  const handleButtonPress = (callback) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    callback();
  };
  
  const handleClaimDailyBonus = () => {
    if (userId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  
  // All certification options
  const certOptions = [
    { id: 'aplus',     name: 'A+ Core 1 (1101)',    color: '#6543CC', icon: 'hardware-chip-outline',  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2 (1102)',    color: '#6543CC', icon: 'desktop-outline',  screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+ (N10-009)',  color: '#FF4C8B', icon: 'git-network-outline',     screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+ (SY0-701)', color: '#2ECC71', icon: 'shield-checkmark-outline', screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+ (CS0-003)',     color: '#3498DB', icon: 'analytics-outline', screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+ (PT0-003)',  color: '#E67E22', icon: 'bug-outline',       screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+ (XK0-005)',    color: '#9B59B6', icon: 'terminal-outline',  screenName: 'LinuxPlusTests' },
    { id: 'caspplus',  name: 'CASP+ (CAS-005)',     color: '#E74C3C', icon: 'shield-outline',    screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+ (CV0-004)',    color: '#3498DB', icon: 'cloud-outline',     screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+ (DA0-001)',     color: '#1ABC9C', icon: 'bar-chart-outline', screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+ (SK0-005)',   color: '#9B59B6', icon: 'server-outline',    screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',               color: '#34495E', icon: 'lock-closed-outline', screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud Practitioner', color: '#F39C12', icon: 'cloud-outline',  screenName: 'AWSCloudTests' },
  ];
  
  // Tools config
  const toolsOptions = [
    { name: "Analogy Hub", color: '#FF4C8B', icon: 'bulb-outline', screen: 'AnalogyHub' },
    { name: "Resources", color: '#9B59B6', icon: 'library-outline', screen: 'Resources' },
    { name: "Scenarios", color: '#2ECC71', icon: 'document-text-outline', screen: 'ScenarioSphere' },
    { name: "GRC", color: '#3498DB', icon: 'shield-outline', screen: 'GRC' },
    { name: "XploitCraft", color: '#E67E22', icon: 'code-slash-outline', screen: 'XploitCraft' },
    { name: "Support", color: '#2196F3', icon: 'help-circle-outline', screen: 'Support' }
  ];
  
  // Navigate to tests
  const navigateToTests = (cert) => {
    handleButtonPress(() => {
      navigation.navigate('Tests', {
        screen: cert.screenName,
        params: {
          category: cert.id,
          title: cert.name,
        },
      });
    });
  };
  
  // Navigate to other screens with haptic feedback
  const navigateWithHaptic = (screenName) => {
    handleButtonPress(() => {
      navigation.navigate(screenName);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Dashboard</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6543CC"
            colors={["#6543CC"]}
          />
        }
      >
        {/* User Stats Panel */}
        {username && (
          <View style={styles.statsPanel}>
            <Text style={styles.welcomeText}>Welcome, {username}</Text>
            
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <View style={styles.xpBar}>
                  <View style={[styles.xpProgress, { width: `${Math.min((xp % 1000) / 10, 100)}%` }]} />
                </View>
                <Text style={styles.xpText}>{xp} XP</Text>
              </View>
            </View>
            
            <View style={styles.coinsContainer}>
              <Ionicons name="cash" size={20} color="#FFD700" />
              <Text style={styles.coinsText}>{coins} Coins</Text>
            </View>
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.dailyButton, canClaimDaily() ? styles.dailyAvailable : null]}
            onPress={() => navigateWithHaptic('DailyStation')}
            activeOpacity={0.85}
          >
            <View style={styles.dailyContent}>
              <Ionicons name="gift-outline" size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.dailyText}>Claim Daily Bonus</Text>
            </View>
            {canClaimDaily() && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cyberButton}
            onPress={() => navigateWithHaptic('Newsletter')}
            activeOpacity={0.85}
          >
            <View style={styles.cyberContent}>
              <Ionicons name="newspaper-outline" size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.cyberText}>Cyber Brief</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Practice Tests Section */}
        <View style={styles.testsHeaderContainer}>
          <Text style={styles.sectionTitle}>Practice Tests</Text>
          <View style={styles.gradIconContainer}>
            <Ionicons name="school" size={22} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {certOptions.map((cert, index) => (
            <TouchableOpacity
              key={cert.id}
              style={[styles.certCard, { backgroundColor: cert.color }]}
              onPress={() => navigateToTests(cert)}
              activeOpacity={0.85}
            >
              <View style={styles.certContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name={cert.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.certName}>{cert.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Training Tools Section */}
        <View style={styles.testsHeaderContainer}>
          <Text style={styles.sectionTitle}>Training Tools</Text>
          <View style={[styles.gradIconContainer, {backgroundColor: '#FF4C8B'}]}>
            <Ionicons name="hammer" size={22} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {toolsOptions.map((tool, index) => (
            <TouchableOpacity
              key={tool.name}
              style={[styles.certCard, { backgroundColor: tool.color }]}
              onPress={() => navigateWithHaptic(tool.screen)}
              activeOpacity={0.85}
            >
              <View style={styles.certContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name={tool.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.certName}>{tool.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Bottom space */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090C1F', // Dark blue-black background
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Stats Panel
  statsPanel: {
    backgroundColor: '#281C5C', // Deep purple background
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#6543CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  xpContainer: {
    flex: 1,
  },
  xpBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  coinsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dailyButton: {
    flex: 1,
    backgroundColor: '#6543CC',
    borderRadius: 15,
    paddingVertical: 16,
    marginRight: 8,
    position: 'relative',
  },
  dailyAvailable: {
    backgroundColor: '#6543CC',
  },
  dailyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  dailyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cyberButton: {
    flex: 1,
    backgroundColor: '#1A2549',
    borderRadius: 15,
    paddingVertical: 16,
    marginLeft: 8,
  },
  cyberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cyberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4C8B',
    right: 15,
    top: 15,
    borderWidth: 2,
    borderColor: '#6543CC',
  },
  
  // Practice Tests Section
  testsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  gradIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6543CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Test Cards Grid
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  certCard: {
    width: (width - 50) / 2,
    height: 110,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  certContent: {
    flex: 1,
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  certName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: 50,
  }
});

export default HomeScreen;
