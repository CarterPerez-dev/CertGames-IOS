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
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme(); // Access the theme
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
    { id: 'aplus',     name: 'A+ Core 1 (1101)',    color: theme.colors.primary, icon: 'hardware-chip-outline',  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2 (1102)',    color: theme.colors.primary, icon: 'desktop-outline',  screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+ (N10-009)',  color: theme.colors.secondary, icon: 'git-network-outline',     screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+ (SY0-701)', color: theme.colors.success, icon: 'shield-checkmark-outline', screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+ (CS0-003)',     color: theme.colors.info, icon: 'analytics-outline', screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+ (PT0-003)',  color: theme.colors.warning, icon: 'bug-outline',       screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+ (XK0-005)',    color: theme.colors.secondary, icon: 'terminal-outline',  screenName: 'LinuxPlusTests' },
    { id: 'caspplus',  name: 'CASP+ (CAS-005)',     color: theme.colors.error, icon: 'shield-outline',    screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+ (CV0-004)',    color: theme.colors.info, icon: 'cloud-outline',     screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+ (DA0-001)',     color: theme.colors.success, icon: 'bar-chart-outline', screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+ (SK0-005)',   color: theme.colors.secondary, icon: 'server-outline',    screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',               color: theme.colors.surface, icon: 'lock-closed-outline', screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud Practitioner', color: theme.colors.warning, icon: 'cloud-outline',  screenName: 'AWSCloudTests' },
  ];
  
  // Tools config
  const toolsOptions = [
    { name: "Analogy Hub", color: theme.colors.secondary, icon: 'bulb-outline', screen: 'AnalogyHub' },
    { name: "Resources", color: theme.colors.secondary, icon: 'library-outline', screen: 'Resources' },
    { name: "Scenarios", color: theme.colors.success, icon: 'document-text-outline', screen: 'ScenarioSphere' },
    { name: "GRC", color: theme.colors.info, icon: 'shield-outline', screen: 'GRC' },
    { name: "XploitCraft", color: theme.colors.warning, icon: 'code-slash-outline', screen: 'XploitCraft' },
    { name: "Support", color: theme.colors.info, icon: 'help-circle-outline', screen: 'Support' }
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, { color: theme.colors.text }]}>Dashboard</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* User Stats Panel */}
        {username && (
          <View style={[styles.statsPanel, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>Welcome, {username}</Text>
            
            <View style={styles.levelRow}>
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.text }]}>
                <Text style={[styles.levelText, { color: theme.colors.textInverse }]}>{level}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <View style={[styles.xpBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <View style={[styles.xpProgress, { width: `${Math.min((xp % 1000) / 10, 100)}%`, backgroundColor: theme.colors.text }]} />
                </View>
                <Text style={[styles.xpText, { color: theme.colors.text }]}>{xp} XP</Text>
              </View>
            </View>
            
            <View style={[styles.coinsContainer, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <Ionicons name="cash" size={20} color={theme.colors.goldBadge} />
              <Text style={[styles.coinsText, { color: theme.colors.text }]}>{coins} Coins</Text>
            </View>
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.dailyButton, 
              { backgroundColor: theme.colors.primary },
              canClaimDaily() && styles.dailyAvailable
            ]}
            onPress={() => navigateWithHaptic('DailyStation')}
            activeOpacity={0.85}
          >
            <View style={styles.dailyContent}>
              <Ionicons name="gift-outline" size={24} color={theme.colors.text} style={styles.buttonIcon} />
              <Text style={[styles.dailyText, { color: theme.colors.text }]}>Claim Daily Bonus</Text>
            </View>
            {canClaimDaily() && (
              <View style={[styles.notificationDot, { backgroundColor: theme.colors.error, borderColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cyberButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigateWithHaptic('Newsletter')}
            activeOpacity={0.85}
          >
            <View style={styles.cyberContent}>
              <Ionicons name="newspaper-outline" size={24} color={theme.colors.text} style={styles.buttonIcon} />
              <Text style={[styles.cyberText, { color: theme.colors.text }]}>Cyber Brief</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Practice Tests Section */}
        <View style={styles.testsHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Practice Tests</Text>
          <View style={[styles.gradIconContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="school" size={22} color={theme.colors.textInverse} />
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
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name={cert.icon} size={24} color={theme.colors.textInverse} />
                </View>
                <Text style={[styles.certName, { color: theme.colors.textInverse }]}>{cert.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Training Tools Section */}
        <View style={styles.testsHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Training Tools</Text>
          <View style={[styles.gradIconContainer, { backgroundColor: theme.colors.secondary }]}>
            <Ionicons name="hammer" size={22} color={theme.colors.textInverse} />
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
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name={tool.icon} size={24} color={theme.colors.textInverse} />
                </View>
                <Text style={[styles.certName, { color: theme.colors.textInverse }]}>{tool.name}</Text>
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 3,
  },
  levelText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  xpContainer: {
    flex: 1,
  },
  xpBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  coinsText: {
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
    borderRadius: 15,
    paddingVertical: 16,
    marginRight: 8,
    position: 'relative',
  },
  dailyAvailable: {
    // Styling applied if daily is available - any additional styles go here
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  cyberButton: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    right: 15,
    top: 15,
    borderWidth: 2,
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
    marginRight: 10,
  },
  gradIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  certName: {
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
