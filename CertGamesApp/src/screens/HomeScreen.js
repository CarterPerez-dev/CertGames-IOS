// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Animated
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchUserData, claimDailyBonus } from '../store/slices/userSlice';
import { useTheme } from '../context/ThemeContext'; 
import { LinearGradient } from 'expo-linear-gradient';
import useUserData from '../hooks/useUserData';
import useXpProgress from '../hooks/useXpProgress';
import { useFocusEffect } from '@react-navigation/native'; // Add this import

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  // Use our custom hook for user data - this will automatically refresh data
  const { 
    userId, 
    username, 
    level, 
    xp, 
    coins, 
    achievements: userAchievements, 
    lastDailyClaim,
    isLoading,
    refreshData
  } = useUserData();
  
  // Keep some things in component state for UI purposes
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const coinsFlashAnim = useRef(new Animated.Value(0)).current;
  const xpFlashAnim = useRef(new Animated.Value(0)).current;
  
  // Store previous values to detect changes for animations
  const prevCoinsRef = useRef(coins);
  const prevXpRef = useRef(xp);
  const prevLevelRef = useRef(level);
  
  // Animated values for cards
  const [cardAnims] = useState([...Array(20)].map(() => new Animated.Value(0)));
  
  // Track level up animation
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const levelUpAnimAnim = useRef(new Animated.Value(0)).current;
  
  // Start animations on mount
  useEffect(() => {
    // Animate main content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Animated cards staggered
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 100 + (i * 70),
        useNativeDriver: true
      }).start();
    });
  }, []);
  
  // This effect triggers the coin animation whenever coins change
  useEffect(() => {
    const prevCoins = prevCoinsRef.current;
    
    // Only animate if coins increased
    if (coins > prevCoins) {
      Animated.sequence([
        Animated.timing(coinsFlashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(coinsFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    // Update ref for next comparison
    prevCoinsRef.current = coins;
  }, [coins, coinsFlashAnim]);
  
  // This effect triggers the XP animation whenever XP changes
  useEffect(() => {
    const prevXp = prevXpRef.current;
    
    // Only animate if XP increased
    if (xp > prevXp) {
      Animated.sequence([
        Animated.timing(xpFlashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(xpFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
    
    // Update ref for next comparison
    prevXpRef.current = xp;
  }, [xp, xpFlashAnim]);
  
  // This effect shows the level up animation when level increases
  useEffect(() => {
    const prevLevel = prevLevelRef.current;
    
    // Show animation if level increased
    if (level > prevLevel && prevLevel > 0) {  // Avoid initial render
      setShowLevelUpAnimation(true);
      
      Animated.sequence([
        Animated.timing(levelUpAnimAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.delay(2000),
        Animated.timing(levelUpAnimAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(() => {
        setShowLevelUpAnimation(false);
      });
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    
    // Update ref for next comparison
    prevLevelRef.current = level;
  }, [level, levelUpAnimAnim]);

  // Add useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh user data whenever HomeScreen comes into focus
      refreshData();
    }, [refreshData])
  );
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Apply haptic feedback on button press
  const handleButtonPress = (callback) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    callback();
  };
  
  const handleClaimDailyBonus = () => {
    if (userId) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      dispatch(claimDailyBonus(userId));
      
      // Animation will be triggered by the useEffect watching for coin changes
    }
  };
  
  // All certification options
  const certOptions = [
    { id: 'aplus',     name: 'A+ Core 1',    icon: 'hardware-chip-outline',  screenName: 'APlusTests' },
    { id: 'aplus2',    name: 'A+ Core 2',    icon: 'desktop-outline',  screenName: 'APlus2Tests' },
    { id: 'nplus',     name: 'Network+',  icon: 'wifi-outline',     screenName: 'NetworkPlusTests' },
    { id: 'secplus',   name: 'Security+', icon: 'shield-checkmark-outline', screenName: 'SecurityPlusTests' },
    { id: 'cysa',      name: 'CySA+',     icon: 'analytics-outline', screenName: 'CySAPlusTests' },
    { id: 'penplus',   name: 'PenTest+',  icon: 'bug-outline',       screenName: 'PenPlusTests' },
    { id: 'linuxplus', name: 'Linux+',    icon: 'terminal-outline',  screenName: 'LinuxPlusTests' },
    { id: 'caspplus',  name: 'CASP+',     icon: 'shield-half-outline',    screenName: 'CaspPlusTests' },
    { id: 'cloudplus', name: 'Cloud+',    icon: 'cloud-outline',     screenName: 'CloudPlusTests' },
    { id: 'dataplus',  name: 'Data+',     icon: 'bar-chart-outline', screenName: 'DataPlusTests' },
    { id: 'serverplus',name: 'Server+',   icon: 'server-outline',    screenName: 'ServerPlusTests' },
    { id: 'cissp',     name: 'CISSP',     icon: 'lock-closed-outline', screenName: 'CisspTests' },
    { id: 'awscloud',  name: 'AWS Cloud', icon: 'thunderstorm-outline',  screenName: 'AWSCloudTests' },
  ];
  
  // Tools config
  const toolsOptions = [
    { name: "Analogy Hub", icon: 'game-controller-outline', screen: 'AnalogyHub' },
    { name: "Resources", icon: 'library-outline', screen: 'Resources' },
    { name: "Scenarios", icon: 'document-text-outline', screen: 'ScenarioSphere' },
    { name: "GRC", icon: 'eye-outline', screen: 'GRC' },
    { name: "XploitCraft", icon: 'finger-print-outline', screen: 'XploitCraft' },
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

  // Calculate XP percentage for progress bar
  const { xpPercentage, remainingXp } = useXpProgress(xp, level);

  // Render level up animation
  const renderLevelUpAnimation = () => {
    if (!showLevelUpAnimation) return null;

    return (
      <Animated.View
        style={[
          styles.levelUpOverlay,
          {
            opacity: levelUpAnimAnim,
            transform: [
              { scale: levelUpAnimAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })},
              { translateY: levelUpAnimAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}
            ],
            backgroundColor: theme.colors.primary + 'E6',
          }
        ]}
      >
        <Text style={[styles.levelUpText, { color: theme.colors.buttonText }]}>
          LEVEL UP! You are now Level {level}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Level up animation */}
      {renderLevelUpAnimation()}
      
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
        scrollEventThrottle={16}
      >
        {/* Header (now part of the scrolling content) */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[theme.colors.primary + '30', theme.colors.background]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={styles.headerGradient}
          >
            <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
              <Text style={{ color: theme.colors.primary }}>CERT</Text>GAMES
            </Text>
            <View style={styles.headerSubtitleBox}>
              <Text style={[styles.headerSubtitle, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                DASHBOARD
              </Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* User Stats Panel */}
        {username && (
          <Animated.View 
            style={[
              styles.statsPanel, 
              { 
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.primary + '40',
                shadowColor: theme.colors.shadow,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.statsPanelHeader}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary + '30']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.statsPanelHeaderGradient}
              >
                <Text style={[styles.welcomeText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                  USER: {username.toUpperCase()}
                </Text>
                <View style={styles.userStatusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={[styles.userStatusText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                    ONLINE
                  </Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={styles.statsContent}>
              <View style={styles.statsRow}>
                <View style={[styles.statsBox, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.statsLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    USER LEVEL
                  </Text>
                  <View style={styles.statsValueRow}>
                    <Animated.View 
                      style={[styles.levelBadge, { 
                        backgroundColor: theme.colors.primary,
                        transform: [{ scale: xpFlashAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.2, 1]
                        })}]
                      }]}
                    >
                      <Text style={[styles.levelText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                        {level}
                      </Text>
                    </Animated.View>
                    <View style={styles.levelProgress}>
                      <Text style={[styles.levelProgressText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                        NEXT LVL: {remainingXp} XP
                      </Text>
                      <Animated.View 
                        style={[styles.progressBarContainer, { 
                          backgroundColor: theme.colors.border + '40',
                          borderColor: xpFlashAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ['transparent', theme.colors.primary, 'transparent']
                          })
                        }]}
                      >
                        <View style={[styles.progressBar, { width: `${xpPercentage}%`, backgroundColor: theme.colors.primary }]} />
                      </Animated.View>
                    </View>
                  </View>
                </View>
                
                <Animated.View 
                  style={[
                    styles.coinsBox, 
                    { 
                      borderColor: theme.colors.border,
                      backgroundColor: coinsFlashAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [theme.colors.surface, theme.colors.goldBadge + '30']
                      })
                    }
                  ]}
                >
                  <Animated.View style={{
                    transform: [{ scale: coinsFlashAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.3, 1]
                    })}]
                  }}>
                    <Ionicons name="cash" size={24} color={theme.colors.goldBadge} style={styles.coinsIcon} />
                  </Animated.View>
                  <Text style={[styles.coinsValue, { color: theme.colors.goldBadge, fontFamily: 'Orbitron-Bold' }]}>
                    {coins.toLocaleString()}
                  </Text>
                  <Text style={[styles.coinsLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    COINS
                  </Text>
                </Animated.View>
              </View>
              
              <Animated.View 
                style={[styles.experienceBox, { 
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  backgroundColor: xpFlashAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.surface, theme.colors.primary + '10']
                  })
                }]}
              >
                <View style={styles.experienceHeader}>
                  <Text style={[styles.experienceLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    EXPERIENCE POINTS
                  </Text>
                  <Text style={[styles.experienceValue, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                    {xp.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.expBar}>
                  <View 
                    style={[
                      styles.expBarSegment, 
                      { 
                        backgroundColor: theme.colors.primary,
                        width: '25%',
                        borderTopLeftRadius: 3,
                        borderBottomLeftRadius: 3
                      }
                    ]} 
                  />
                  <View style={[styles.expBarSegment, { backgroundColor: theme.colors.secondary, width: '45%' }]} />
                  <View 
                    style={[
                      styles.expBarSegment, 
                      { 
                        backgroundColor: theme.colors.accent || theme.colors.error,
                        width: '30%',
                        borderTopRightRadius: 3,
                        borderBottomRightRadius: 3
                      }
                    ]} 
                  />
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.dailyButton, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => navigateWithHaptic('DailyStation')}
            activeOpacity={0.85}
          >
            <View style={styles.dailyContent}>
              <View style={[
                styles.actionIconContainer, 
                { backgroundColor: theme.colors.primary }
              ]}>
                <Ionicons 
                  name="gift-outline" 
                  size={24} 
                  color={theme.colors.buttonText}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                  DAILY BONUS
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  CHECK REWARDS
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cyberButton, { 
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }]}
            onPress={() => navigateWithHaptic('Newsletter')}
            activeOpacity={0.85}
          >
            <View style={styles.cyberContent}>
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.secondary }]}>
                <Ionicons 
                  name="newspaper-outline" 
                  size={24} 
                  color={theme.colors.buttonText}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                  CYBER BRIEF
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  WEEKLY INTEL
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Practice Tests Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
            <LinearGradient
              colors={['transparent', theme.colors.primary + '40', 'transparent']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={styles.sectionTitleGradient}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
              PRACTICE TESTS
            </Text>
          </View>
          
          <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="school" size={22} color={theme.colors.buttonText} />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {certOptions.map((cert, index) => {
            const animIndex = Math.min(index, cardAnims.length - 1);
            
            return (
              <Animated.View
                key={cert.id}
                style={{
                  opacity: cardAnims[animIndex],
                  transform: [{
                    translateY: cardAnims[animIndex].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={[styles.certCard, { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }]}
                  onPress={() => navigateToTests(cert)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[theme.colors.testCard + '80', theme.colors.testCard]}
                    start={{x: 0, y: 0}}
                    end={{x: 0, y: 1}}
                    style={styles.certCardHeader}
                  >
                    <Ionicons name={cert.icon} size={20} color={theme.colors.buttonText} />
                  </LinearGradient>
                  
                  <View style={styles.certCardBody}>
                    <Text style={[styles.certName, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      {cert.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Training Tools Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.secondary + '20' }]}>
            <LinearGradient
              colors={['transparent', theme.colors.secondary + '40', 'transparent']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={styles.sectionTitleGradient}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
              TRAINING TOOLS
            </Text>
          </View>
          
          <View style={[styles.sectionIcon, { backgroundColor: theme.colors.secondary }]}>
            <Ionicons name="construct-outline" size={22} color={theme.colors.buttonText} />
          </View>
        </View>
        
        <View style={styles.testsGrid}>
          {toolsOptions.map((tool, index) => {
            const animIndex = Math.min(index + certOptions.length, cardAnims.length - 1);
            
            return (
              <Animated.View
                key={tool.name}
                style={{
                  opacity: cardAnims[animIndex],
                  transform: [{
                    translateY: cardAnims[animIndex].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={[styles.toolCard, { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }]}
                  onPress={() => navigateWithHaptic(tool.screen)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[theme.colors.toolCard + '80', theme.colors.toolCard]}
                    start={{x: 0, y: 0}}
                    end={{x: 0, y: 1}}
                    style={styles.toolCardHeader}
                  >
                    <Ionicons name={tool.icon} size={20} color={theme.colors.buttonText} />
                  </LinearGradient>
                  
                  <View style={styles.toolCardBody}>
                    <Text style={[styles.toolName, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      {tool.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Bottom space */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // All the same styles as before
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 5,
  },
  headerSubtitleBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerSubtitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  
  // Level up animation
  levelUpOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1000,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Stats Panel
  statsPanel: {
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statsPanelHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statsPanelHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    flexShrink: 1,
  },
  userStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
    marginRight: 6,
  },
  userStatusText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  statsContent: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsBox: {
    flex: 2,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  statsLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelProgress: {
    flex: 1,
  },
  levelProgressText: {
    fontSize: 10,
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    borderWidth: 1,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 3,
  },
  coinsBox: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsIcon: {
    marginBottom: 5,
  },
  coinsValue: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  coinsLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  experienceBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  experienceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
  },
  expBarSegment: {
    height: '100%',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  dailyButton: {
    flex: 1,
    borderRadius: 10,
    marginRight: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cyberButton: {
    flex: 1,
    borderRadius: 10,
    marginLeft: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dailyContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cyberContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: '130%',
    height: '130%',
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.6,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitleBg: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionTitleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Test Cards Grid
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  certCard: {
    width: (width - 40) / 2,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  certCardHeader: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certName: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  toolCard: {
    width: (width - 40) / 2,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  toolCardHeader: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolName: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: 50,
  }
});

export default HomeScreen;
