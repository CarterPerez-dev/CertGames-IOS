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
import { useTheme } from '../context/ThemeContext'; 

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme(); 
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
  
  // All certification options - now use theme.colors.testCard for all
  const certOptions = [
    { id: 'aplus',     name: 'A+ Core 1 (1101)',    icon: 'hardware-chip-outline',  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2 (1102)',    icon: 'desktop-outline',  screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+ (N10-009)',  icon: 'git-network-outline',     screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+ (SY0-701)', icon: 'shield-checkmark-outline', screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+ (CS0-003)',     icon: 'analytics-outline', screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+ (PT0-003)',  icon: 'bug-outline',       screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+ (XK0-005)',    icon: 'terminal-outline',  screenName: 'LinuxPlusTests' },
    { id: 'caspplus',  name: 'CASP+ (CAS-005)',     icon: 'shield-outline',    screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+ (CV0-004)',    icon: 'cloud-outline',     screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+ (DA0-001)',     icon: 'bar-chart-outline', screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+ (SK0-005)',   icon: 'server-outline',    screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',               icon: 'lock-closed-outline', screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud Practitioner', icon: 'cloud-outline',  screenName: 'AWSCloudTests' },
  ];
  
  // Tools config - now use theme.colors.toolCard for all
  const toolsOptions = [
    { name: "Analogy Hub", icon: 'bulb-outline', screen: 'AnalogyHub' },
    { name: "Resources", icon: 'library-outline', screen: 'Resources' },
    { name: "Scenarios", icon: 'document-text-outline', screen: 'ScenarioSphere' },
    { name: "GRC", icon: 'shield-outline', screen: 'GRC' },
    { name: "XploitCraft", icon: 'code-slash-outline', screen: 'XploitCraft' },
    { name: "Support", icon: 'help-circle-outline', screen: 'Support' }
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
          <View style={[styles.statsPanel, { 
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }]}>
            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>Welcome, {username}</Text>
            
            <View style={styles.levelRow}>
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }]}>
                <Text style={[styles.levelText, { color: theme.colors.buttonText }]}>{level}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <View style={[styles.xpBar, { backgroundColor: `${theme.colors.border}70` }]}>
                  <View style={[styles.xpProgress, { width: `${Math.min((xp % 1000) / 10, 100)}%`, backgroundColor: theme.colors.primary }]} />
                </View>
                <Text style={[styles.xpText, { color: theme.colors.text }]}>{xp} XP</Text>
              </View>
            </View>
            
            <View style={[styles.coinsContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
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
              { 
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}80`,
              },
              canClaimDaily() && styles.dailyAvailable
            ]}
            onPress={() => navigateWithHaptic('DailyStation')}
            activeOpacity={0.85}
          >
            <View style={styles.dailyContent}>
              <Ionicons name="gift-outline" size={24} color={theme.colors.buttonText} style={styles.buttonIcon} />
              <Text style={[styles.dailyText, { color: theme.colors.buttonText }]}>Claim Daily Bonus</Text>
            </View>
            {canClaimDaily() && (
              <View style={[styles.notificationDot, { backgroundColor: theme.colors.error, borderColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cyberButton, { 
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }]}
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
            <Ionicons name="school" size={22} color={theme.colors.buttonText} />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {certOptions.map((cert, index) => (
            <TouchableOpacity
              key={cert.id}
              style={[styles.certCard, { 
                backgroundColor: theme.colors.testCard,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: `${theme.colors.toolCard}80`,
              }]}
              onPress={() => navigateToTests(cert)}
              activeOpacity={0.85}
            >
              <View style={styles.certContent}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.buttonText}20` }]}>
                  <Ionicons name={cert.icon} size={24} color={theme.colors.buttonText} />
                </View>
                <Text style={[styles.certName, { color: theme.colors.buttonText }]}>{cert.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Training Tools Section */}
        <View style={styles.testsHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Training Tools</Text>
          <View style={[styles.gradIconContainer, { backgroundColor: theme.colors.secondary }]}>
            <Ionicons name="hammer" size={22} color={theme.colors.buttonText} />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {toolsOptions.map((tool, index) => (
            <TouchableOpacity
              key={tool.name}
              style={[styles.certCard, { 
                backgroundColor: theme.colors.toolCard,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: `${theme.colors.toolCard}80`,
              }]}
              onPress={() => navigateWithHaptic(tool.screen)}
              activeOpacity={0.85}
            >
              <View style={styles.certContent}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.buttonText}20` }]}>
                  <Ionicons name={tool.icon} size={24} color={theme.colors.buttonText} />
                </View>
                <Text style={[styles.certName, { color: theme.colors.buttonText }]}>{tool.name}</Text>
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
