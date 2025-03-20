// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  Dimensions,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUserData, claimDailyBonus } from '../store/slices/userSlice';
import { BlurView } from 'expo-blur';
import { SharedElement } from 'react-navigation-shared-element';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  SlideInRight
} from 'react-native-reanimated';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Animation components
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userId, username, level, xp, coins, status, lastDailyClaim } = useSelector((state) => state.user);
  const isLoading = status === 'loading';
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const welcomeScale = useSharedValue(0.9);
  
  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    welcomeScale.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, userId, headerOpacity, welcomeScale]);
  
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
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });
  
  const welcomeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: welcomeScale.value }],
    };
  });
  
  // Complete list of all certification options (combined primary and secondary)
  const allCertOptions = [
    { id: 'aplus',     name: 'A+ Core 1 (1101)',    color: '#6543CC', gradientColors: ['#6543CC', '#8A58FC'], icon: 'desktop-outline',  primary: true,  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2 (1102)',    color: '#1ABC9C', gradientColors: ['#159b80', '#1ABC9C'], icon: 'desktop-outline',  primary: false, screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+ (N10-009)',  color: '#FF4C8B', gradientColors: ['#E03A76', '#FF4C8B'], icon: 'wifi-outline',     primary: true,  screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+ (SY0-701)', color: '#2ECC71', gradientColors: ['#27ae60', '#2ECC71'], icon: 'shield-checkmark-outline', primary: true,  screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+ (CS0-003)',     color: '#3498DB', gradientColors: ['#2980b9', '#3498DB'], icon: 'analytics-outline', primary: true,  screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+ (PT0-003)',  color: '#E67E22', gradientColors: ['#d35400', '#E67E22'], icon: 'bug-outline',       primary: true,  screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+ (XK0-005)',    color: '#9B59B6', gradientColors: ['#8e44ad', '#9B59B6'], icon: 'terminal-outline',  primary: true,  screenName: 'LinuxPlusTests' },
    { id: 'caspplus',  name: 'CASP+ (CAS-005)',     color: '#E74C3C', gradientColors: ['#c0392b', '#E74C3C'], icon: 'shield-outline',    primary: false, screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+ (CV0-004)',    color: '#3498DB', gradientColors: ['#2980b9', '#3498DB'], icon: 'cloud-outline',     primary: false, screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+ (DA0-001)',     color: '#1ABC9C', gradientColors: ['#16a085', '#1ABC9C'], icon: 'bar-chart-outline', primary: false, screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+ (SK0-005)',   color: '#9B59B6', gradientColors: ['#8e44ad', '#9B59B6'], icon: 'server-outline',    primary: false, screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',               color: '#34495E', gradientColors: ['#2c3e50', '#34495E'], icon: 'lock-closed-outline',primary: false,screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud Practitioner', color: '#F39C12', gradientColors: ['#e67e22', '#F39C12'], icon: 'cloud-outline',   primary: false, screenName: 'AWSCloudTests' },
  ];
  
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
  
  // Define training tools for cleaner rendering
  const trainingTools = [
    {
      id: 'analogy',
      name: 'Analogy Hub', 
      description: 'Learn complex concepts with analogies',
      icon: 'bulb-outline',
      color: '#FF4C8B',
      gradientColors: ['#E03A76', '#FF4C8B'],
      screenName: 'AnalogyHub'
    },
    {
      id: 'resources',
      name: 'Resources Hub', 
      description: 'Learning resources and tools',
      icon: 'library-outline',
      color: '#9B59B6',
      gradientColors: ['#8e44ad', '#9B59B6'],
      screenName: 'Resources'
    },
    {
      id: 'scenario',
      name: 'Scenario Sphere', 
      description: 'Practice with real-world scenarios',
      icon: 'document-text-outline',
      color: '#2ECC71',
      gradientColors: ['#27ae60', '#2ECC71'],
      screenName: 'ScenarioSphere'
    },
    {
      id: 'grc',
      name: 'GRC Questions', 
      description: 'Governance, Risk & Compliance',
      icon: 'shield-outline',
      color: '#3498DB',
      gradientColors: ['#2980b9', '#3498DB'],
      screenName: 'GRC'
    },
    {
      id: 'xploit',
      name: 'XploitCraft', 
      description: 'Explore security exploit concepts',
      icon: 'code-slash-outline',
      color: '#E67E22',
      gradientColors: ['#d35400', '#E67E22'],
      screenName: 'XploitCraft'
    },
    {
      id: 'support',
      name: 'Contact Support', 
      description: 'Get help with any questions or issues',
      icon: 'help-circle-outline',
      color: '#2196F3',
      gradientColors: ['#1976D2', '#2196F3'],
      screenName: 'Support'
    }
  ];
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background graphics */}
      <View style={styles.backgroundGraphics}>
        <LinearGradient
          colors={['rgba(101, 67, 204, 0.2)', 'rgba(0, 0, 0, 0)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.topLeftGradient}
        />
        <LinearGradient
          colors={['rgba(255, 76, 139, 0.15)', 'rgba(0, 0, 0, 0)']}
          start={{x: 1, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.topRightGradient}
        />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={onRefresh}
            tintColor="#6543CC"
            colors={["#6543CC"]}
          />
        }
      >
        {/* Header Section */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Animated.View style={[styles.welcomeContainer, welcomeAnimatedStyle]}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{username}</Text>
          </Animated.View>
          
          <View style={styles.statsRow}>
            <Animated.View entering={FadeIn.delay(200).duration(600)}>
              <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Profile')}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.statGradient}
                >
                  <Ionicons name="trophy" size={14} color="#FFFFFF" />
                  <Text style={styles.statValue}>Level {level}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(300).duration(600)}>
              <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Profile')}>
                <LinearGradient
                  colors={['#FF4C8B', '#FF7950']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.statGradient}
                >
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                  <Text style={styles.statValue}>{xp} XP</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(400).duration(600)}>
              <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Shop')}>
                <LinearGradient
                  colors={['#2ECC71', '#1ABC9C']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.statGradient}
                >
                  <Ionicons name="cash" size={14} color="#FFFFFF" />
                  <Text style={styles.statValue}>{coins}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
        
        {/* Featured Cards Section */}
        <View style={styles.featuredCardsContainer}>
          {/* Daily Bonus Card */}
          <AnimatedTouchableOpacity 
            style={styles.featuredCard}
            onPress={() => navigation.navigate('DailyStation')}
            entering={SlideInRight.delay(200).duration(500)}
          >
            <LinearGradient
              colors={canClaimDaily() ? ['#6543CC', '#8A58FC'] : ['#4e4e4e', '#696969']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.featuredCardGradient}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.cardIconContainer}>
                  <Ionicons
                    name={canClaimDaily() ? 'gift' : 'calendar'}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    {canClaimDaily() ? 'Daily Bonus Available!' : 'Daily Station'}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {canClaimDaily()
                      ? 'Claim 250 coins and answer daily challenge'
                      : 'Check daily challenge and return tomorrow for bonus'}
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </AnimatedTouchableOpacity>
          
          {/* Newsletter Card */}
          <AnimatedTouchableOpacity 
            style={styles.featuredCard}
            onPress={() => navigation.navigate('Newsletter')}
            entering={SlideInRight.delay(400).duration(500)}
          >
            <LinearGradient
              colors={['#FF4C8B', '#FF7950']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.featuredCardGradient}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="newspaper" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Daily Cyber Brief</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    Subscribe to our cybersecurity newsletter
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </AnimatedTouchableOpacity>
        </View>
        
        {/* Certification Tests Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={22} color="#6543CC" />
            <Text style={styles.sectionTitle}>Practice Tests</Text>
          </View>
          
          <View style={styles.certGrid}>
            {allCertOptions.map((cert, index) => (
              <TouchableOpacity
                key={cert.id}
                style={styles.certCard}
                onPress={() => navigateToTests(cert)}
              >
                <LinearGradient
                  colors={cert.gradientColors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.certCardGradient}
                >
                  <View style={styles.certCardContent}>
                    <Ionicons name={cert.icon} size={24} color="#FFFFFF" />
                    <Text style={styles.certName} numberOfLines={2}>{cert.name}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Training Tools Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={22} color="#FF4C8B" />
            <Text style={styles.sectionTitle}>Training Tools</Text>
          </View>
          
          <View style={styles.toolsContainer}>
            {trainingTools.map((tool, index) => (
              <TouchableOpacity 
                key={tool.id}
                style={styles.toolCard}
                onPress={() => navigation.navigate(tool.screenName)}
              >
                <LinearGradient
                  colors={tool.gradientColors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.toolIconGradient}
                >
                  <Ionicons name={tool.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
                
                <View style={styles.toolInfo}>
                  <Text style={styles.toolTitle}>{tool.name}</Text>
                  <Text style={styles.toolDescription} numberOfLines={1}>
                    {tool.description}
                  </Text>
                </View>
                
                <View style={styles.toolArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#6543CC" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C11',
  },
  backgroundGraphics: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  topLeftGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.7,
    height: height * 0.4,
    borderBottomRightRadius: 300,
  },
  topRightGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.7,
    height: height * 0.3,
    borderBottomLeftRadius: 300,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statCard: {
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuredCardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuredCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  featuredCardGradient: {
    borderRadius: 16,
  },
  cardOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  certCard: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  certCardGradient: {
    width: '100%',
    height: '100%',
  },
  certCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  certName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toolsContainer: {
    // Full width row of cards
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toolIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  toolArrow: {
    marginLeft: 10,
  },
});

export default HomeScreen;
