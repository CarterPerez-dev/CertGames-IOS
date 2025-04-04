// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  RefreshControl // Added missing RefreshControl import
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useFocusEffect } from '@react-navigation/native';

// Import useUserData hook for real-time data
import useUserData from '../../hooks/useUserData';
import useXpProgress from '../../hooks/useXpProgress';

import { deleteUserAccount } from '../../api/authService';
import { changeUsername, changePassword } from '../../api/profileService';
import apiClient from '../../api/apiClient';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Use our custom hook for user data - this will automatically refresh data
  const { 
    userId, 
    username, 
    xp, 
    level, 
    coins, 
    achievements, 
    lastDailyClaim,
    xpBoost,
    currentAvatar,
    nameColor,
    purchasedItems,
    subscriptionActive,
    oauth_provider,
    shopItems,
    getAvatarUrl,
    refreshData,
    isLoading
  } = useUserData();
  
  // Make sure we have activeTab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const coinsFlashAnim = useRef(new Animated.Value(0)).current;
  const xpFlashAnim = useRef(new Animated.Value(0)).current;
  
  // Store previous values to detect changes for animations
  const prevCoinsRef = useRef(coins);
  const prevXpRef = useRef(xp);
  const prevLevelRef = useRef(level);
  
  // Track level up animation
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const levelUpAnimAnim = useRef(new Animated.Value(0)).current;
  
  // Username form state
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Password form state (only for security tab)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Status message
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success', 'error'
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Local state for UI updates
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Delete account state
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );
  
  // Start animations on mount
  useEffect(() => {
    // Animate main content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateY]);
  
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

  // Calculate XP percentage for progress bar
  const { xpPercentage, remainingXp } = useXpProgress(xp, level);
  
  // Get avatar URL
  const avatarUrl = getAvatarUrl();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  // Handle logout
  const handleLogout = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            await SecureStore.deleteItemAsync('userId');
            dispatch(logout());
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Show status message
  const showStatusMessage = (message, type = 'success') => {
    setStatusMessage(message);
    setStatusType(type);
    setShowStatusModal(true);
    
    // Hide after 3 seconds
    setTimeout(() => {
      setShowStatusModal(false);
      setStatusMessage('');
      setStatusType('');
    }, 3000);
  };
  
  // Handle username change
  const handleChangeUsername = async () => {
    if (!newUsername) {
      showStatusMessage('Please enter a new username', 'error');
      return;
    }
    
    // Basic validation
    if (newUsername.length < 3 || newUsername.length > 30) {
      showStatusMessage('Username must be between 3 and 30 characters', 'error');
      return;
    }
    
    setUsernameLoading(true);
    
    try {
      await changeUsername(userId, newUsername);
      
      showStatusMessage('Username updated successfully!');
      setShowChangeUsername(false);
      setNewUsername('');
      
      // Refresh user data
      refreshData();
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error changing username:', error);
      showStatusMessage(error.message || 'Failed to update username. Please try again.', 'error');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setUsernameLoading(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showStatusMessage('All password fields are required', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showStatusMessage('New passwords do not match', 'error');
      return;
    }
    
    // Password strength validation
    if (newPassword.length < 6) {
      showStatusMessage('Password must be at least 6 characters long', 'error');
      return;
    }
    
    // Check for uppercase, lowercase, number and special character
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()\-_=+\[\]{}|;:'",<.>/?`~\\]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      showStatusMessage('Password must include uppercase, lowercase, number and special character', 'error');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await changePassword(userId, oldPassword, newPassword, confirmPassword);
      
      showStatusMessage('Password updated successfully!');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showStatusMessage(error.message || 'Failed to update password. Please try again.', 'error');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This action cannot be undone and all data linked to your account will be permanently deleted. If you have an active subscription, please cancel it in the App Store subscription management. If you signed up through the website, your subscription will automatically be canceled.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete Account',
            onPress: async () => {
              try {
                setDeleteAccountLoading(true);
                
                // Use the new service method
                await deleteUserAccount(userId);
                
                // Dispatch logout action to clear Redux state
                dispatch(logout());
                
                // Optional: Show a success message or navigate
                if (Platform.OS === 'ios') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              } catch (error) {
                console.error('Error deleting account:', error);
                
                // Use your existing error handling
                showStatusMessage(
                  error.response?.data?.error || 'Failed to delete account. Please try again.', 
                  'error'
                );
                
                if (Platform.OS === 'ios') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
              } finally {
                setDeleteAccountLoading(false);
              }
            },
          }
        ]
      );
  };
  
  // Handle OAuth user trying to change password
  const handleOAuthPasswordChange = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      'Password Change Not Available',
      'Password change is not available for accounts created using social login. Please manage your account security through your social provider.',
      [{ text: 'OK' }]
    );
  };
  
  // Navigate to Achievements screen
  const goToAchievements = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Achievements');
  };
  
  // Navigate to Theme Settings
  const goToThemeSettings = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ThemeSettings');
  };
  
  // Navigate to Shop
  const goToShop = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Shop');
  };
  
  // Navigate to Support
  const goToSupport = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Support');
  };
  
  // Handle avatar image error
  const handleAvatarError = () => {
    console.log('Avatar image failed to load');
    setAvatarError(true);
  };

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

  // Header animation effect
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <StatusBar barStyle="light-content" />

      {/* Level up animation */}
      {renderLevelUpAnimation()}

      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            opacity: headerOpacity,
            backgroundColor: theme.colors.headerBackground 
          }
        ]}
      >
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
            USER PROFILE
          </Text>
        </LinearGradient>
      </Animated.View>
      
      <StatusModal 
        visible={showStatusModal}
        message={statusMessage}
        type={statusType}
        onClose={() => setShowStatusModal(false)}
        theme={theme}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.profileHeader,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileHeaderGradient}
          >
            <View style={styles.avatarSection}>
              <View style={[styles.avatarContainer, { borderColor: theme.colors.buttonText + '40' }]}>
                {!avatarError && avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    onError={handleAvatarError}
                  />
                ) : (
                  <Image 
                    source={require('../../../assets/default-avatar.png')}
                    style={styles.avatar}
                  />
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.usernameText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                  {username ? username.toUpperCase() : 'USER'}
                </Text>
                
                <View style={styles.levelContainer}>
                  <Animated.View 
                    style={[styles.levelBadge, { 
                      backgroundColor: theme.colors.buttonText + '30',
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
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderColor: xpFlashAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ['transparent', theme.colors.buttonText, 'transparent']
                        })
                      }]}
                    >
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${xpPercentage}%`, backgroundColor: theme.colors.buttonText }
                        ]} 
                      />
                    </Animated.View>
                  </View>
                </View>
                
                <View style={styles.statsRow}>
                  <Animated.View 
                    style={[
                      styles.statItem, 
                      { 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        backgroundColor: coinsFlashAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['rgba(0, 0, 0, 0.2)', theme.colors.goldBadge + '40']
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
                      <Ionicons name="wallet-outline" size={18} color={theme.colors.goldBadge} />
                    </Animated.View>
                    <Text style={[styles.statText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                      {coins.toLocaleString()}
                    </Text>
                  </Animated.View>
                  
                  <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                    <Ionicons name="trophy-outline" size={18} color={theme.colors.goldBadge} />
                    <Text style={[styles.statText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                      {achievements.length}
                    </Text>
                  </View>
                  
                  <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                    <Ionicons name="star-outline" size={18} color={theme.colors.goldBadge} />
                    <Text style={[styles.statText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                      {purchasedItems.length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={[styles.securityIndicator, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
              <View style={styles.securityStatus}>
                <View style={[styles.statusDot, { backgroundColor: '#2ECC71' }]} />
                <Text style={[styles.securityText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                  USER DATABASE
                </Text>
              </View>
              <Text style={[styles.idText, { color: theme.colors.buttonText + '80', fontFamily: 'ShareTechMono' }]}>
                ID: {userId ? userId.substring(0, 8).toUpperCase() : 'XXXXXXXX'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Tabs Navigation */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'overview' && [
                styles.activeTab, 
                { backgroundColor: theme.colors.primary }
              ]
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[
              styles.tabText, 
              { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' },
              activeTab === 'overview' && [
                styles.activeTabText, 
                { color: theme.colors.buttonText }
              ]
            ]}>
              OVERVIEW
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'account' && [
                styles.activeTab, 
                { backgroundColor: theme.colors.primary }
              ]
            ]}
            onPress={() => setActiveTab('account')}
          >
            <Text style={[
              styles.tabText, 
              { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' },
              activeTab === 'account' && [
                styles.activeTabText, 
                { color: theme.colors.buttonText }
              ]
            ]}>
              ACCOUNT
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'security' && [
                styles.activeTab, 
                { backgroundColor: theme.colors.primary }
              ]
            ]}
            onPress={() => setActiveTab('security')}
          >
            <Text style={[
              styles.tabText, 
              { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' },
              activeTab === 'security' && [
                styles.activeTabText, 
                { color: theme.colors.buttonText }
              ]
            ]}>
              SECURITY
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content - add more as needed for account and security tabs */}
        {activeTab === 'overview' && (
          <Animated.View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            {/* Profile Stats Section */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  USER STATISTICS
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="analytics" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.statsPanel, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              <View style={styles.statsContent}>
                <View style={[styles.statsRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>LEVEL</Text>
                    <Animated.Text style={[
                      styles.statValue, 
                      { 
                        color: theme.colors.text, 
                        fontFamily: 'Orbitron-Bold',
                        transform: [{ scale: xpFlashAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.1, 1]
                        })}]
                      }
                    ]}>
                      {level}
                    </Animated.Text>
                  </View>
                  
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>XP POINTS</Text>
                    <Animated.Text style={[
                      styles.statValue, 
                      { 
                        color: theme.colors.text, 
                        fontFamily: 'Orbitron-Bold',
                        backgroundColor: xpFlashAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ['transparent', theme.colors.primary + '30', 'transparent']
                        })
                      }
                    ]}>
                      {xp.toLocaleString()}
                    </Animated.Text>
                  </View>
                </View>
                
                <View style={[styles.statsRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>COINS</Text>
                    <Animated.Text style={[
                      styles.statValue, 
                      { 
                        color: theme.colors.goldBadge, 
                        fontFamily: 'Orbitron-Bold',
                        backgroundColor: coinsFlashAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ['transparent', theme.colors.goldBadge + '30', 'transparent']
                        })
                      }
                    ]}>
                      {coins.toLocaleString()}
                    </Animated.Text>
                  </View>
                  
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>ACHIEVEMENTS</Text>
                    <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>{achievements.length}</Text>
                  </View>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>ITEMS</Text>
                    <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>{purchasedItems.length}</Text>
                  </View>
                  
                  <View style={styles.statBlock}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>SUBSCRIPTION</Text>
                    <Text style={[
                      styles.statValue, 
                      { 
                        color: subscriptionActive ? theme.colors.success : theme.colors.error,
                        fontFamily: 'Orbitron-Bold' 
                      }
                    ]}>
                      {subscriptionActive ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Quick Actions Section */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.secondary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.secondary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  QUICK ACTIONS
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.secondary }]}>
                <Ionicons name="flash" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                }]}
                onPress={goToAchievements}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[theme.colors.primary + '80', theme.colors.primary]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.actionCardHeader}
                >
                  <Ionicons name="trophy" size={24} color={theme.colors.buttonText} />
                </LinearGradient>
                
                <View style={styles.actionCardBody}>
                  <Text style={[styles.actionCardTitle, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    ACHIEVEMENTS
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                }]}
                onPress={goToShop}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[theme.colors.toolCard + '80', theme.colors.toolCard]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.actionCardHeader}
                >
                  <Ionicons name="cart" size={24} color={theme.colors.buttonText} />
                </LinearGradient>
                
                <View style={styles.actionCardBody}>
                  <Text style={[styles.actionCardTitle, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    SHOP
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                }]}
                onPress={goToThemeSettings}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[theme.colors.secondary + '80', theme.colors.secondary]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.actionCardHeader}
                >
                  <Ionicons name="color-palette" size={24} color={theme.colors.buttonText} />
                </LinearGradient>
                
                <View style={styles.actionCardBody}>
                  <Text style={[styles.actionCardTitle, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    THEMES
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                }]}
                onPress={goToSupport}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[theme.colors.testCard + '80', theme.colors.testCard]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.actionCardHeader}
                >
                  <Ionicons name="help-circle" size={24} color={theme.colors.buttonText} />
                </LinearGradient>
                
                <View style={styles.actionCardBody}>
                  <Text style={[styles.actionCardTitle, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    SUPPORT
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.logoutButton,
                { backgroundColor: theme.colors.error }
              ]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color={theme.colors.buttonText} />
<Text style={[styles.logoutButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                LOGOUT
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {activeTab === 'account' && (
          <Animated.View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  ACCOUNT SETTINGS
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="person" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.settingsPanel, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              {/* Change Username */}
              <View style={styles.settingsSection}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingLabelContainer}>
                    <Ionicons name="person" size={18} color={theme.colors.primary} />
                    <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      USERNAME
                    </Text>
                  </View>
                  
                  <Text style={[styles.settingValue, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    {username}
                  </Text>
                </View>
                
                {showChangeUsername ? (
                  <View style={styles.changeForm}>
                    <TextInput
                      style={[
                        styles.settingInput,
                        { 
                          backgroundColor: theme.colors.inputBackground, 
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                          fontFamily: 'ShareTechMono'
                        }
                      ]}
                      placeholder="New username"
                      placeholderTextColor={theme.colors.placeholder}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      autoCapitalize="none"
                      returnKeyType="done"
                      editable={!usernameLoading}
                    />
                    
                    <View style={styles.formActions}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          { backgroundColor: theme.colors.primary }
                        ]}
                        onPress={handleChangeUsername}
                        disabled={usernameLoading}
                      >
                        {usernameLoading ? (
                          <ActivityIndicator color={theme.colors.buttonText} size="small" />
                        ) : (
                          <Text style={[styles.actionButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                            SAVE
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.cancelButton, 
                          { borderColor: theme.colors.border }
                        ]}
                        onPress={() => {
                          setShowChangeUsername(false);
                          setNewUsername('');
                        }}
                        disabled={usernameLoading}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                          CANCEL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.changeButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '60' }
                    ]}
                    onPress={() => setShowChangeUsername(true)}
                  >
                    <Ionicons name="create" size={16} color={theme.colors.primary} />
                    <Text style={[styles.changeButtonText, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
                      CHANGE USERNAME
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Theme Settings */}
              <View style={styles.settingsSection}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingLabelContainer}>
                    <Ionicons name="color-palette" size={18} color={theme.colors.primary} />
                    <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      THEME
                    </Text>
                  </View>
                  
                  <Text style={[styles.themeValue, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
                    {theme.name.toUpperCase()}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.changeButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '60' }
                  ]}
                  onPress={goToThemeSettings}
                >
                  <Ionicons name="color-wand" size={16} color={theme.colors.primary} />
                  <Text style={[styles.changeButtonText, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
                    CUSTOMIZE THEME
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.supportButton,
                { backgroundColor: theme.colors.secondary }
              ]} 
              onPress={goToSupport}
            >
              <Ionicons name="help-circle" size={20} color={theme.colors.buttonText} />
              <Text style={[styles.supportButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                CONTACT SUPPORT
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.logoutButton,
                { backgroundColor: theme.colors.error }
              ]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color={theme.colors.buttonText} />
              <Text style={[styles.logoutButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                LOGOUT
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {activeTab === 'security' && (
          <Animated.View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  SECURITY SETTINGS
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="shield" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.settingsPanel, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              {/* Change Password */}
              <View style={styles.settingsSection}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingLabelContainer}>
                    <Ionicons name="lock-closed" size={18} color={theme.colors.primary} />
                    <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      PASSWORD
                    </Text>
                  </View>
                  
                  <Text style={[styles.settingValue, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  Password change is not available for accounts created using social login. Please manage your account security through your social provider.
                  </Text>
                </View>
                
                {showChangePassword && !oauth_provider ? (
                  <View style={styles.changeForm}>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[
                          styles.settingInput,
                          { 
                            backgroundColor: theme.colors.inputBackground, 
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder="Current password"
                        placeholderTextColor={theme.colors.placeholder}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry={!showOldPassword}
                        autoCapitalize="none"
                        editable={!passwordLoading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowOldPassword(!showOldPassword)}
                      >
                        <Ionicons
                          name={showOldPassword ? "eye-off" : "eye"}
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[
                          styles.settingInput,
                          { 
                            backgroundColor: theme.colors.inputBackground, 
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder="New password"
                        placeholderTextColor={theme.colors.placeholder}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        editable={!passwordLoading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-off" : "eye"}
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[
                          styles.settingInput,
                          { 
                            backgroundColor: theme.colors.inputBackground, 
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder="Confirm new password"
                        placeholderTextColor={theme.colors.placeholder}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        editable={!passwordLoading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={20}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.formActions}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          { backgroundColor: theme.colors.primary }
                        ]}
                        onPress={handleChangePassword}
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? (
                          <ActivityIndicator color={theme.colors.buttonText} size="small" />
                        ) : (
                          <Text style={[styles.actionButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                            UPDATE
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.cancelButton, 
                          { borderColor: theme.colors.border }
                        ]}
                        onPress={() => {
                          setShowChangePassword(false);
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        disabled={passwordLoading}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                          CANCEL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.changeButton,
                      { 
                        backgroundColor: theme.colors.surface, 
                        borderColor: theme.colors.primary + (oauth_provider ? '30' : '60'),
                        opacity: oauth_provider ? 0.7 : 1
                      }
                    ]}
                    onPress={() => {
                      if (oauth_provider) {
                        handleOAuthPasswordChange();
                        return;
                      }
                        setShowChangePassword(true);
                    }}
                  >
                    <Ionicons 
                      name={oauth_provider ? "information-circle" : "create"} 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                    <Text style={[styles.changeButtonText, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
                      {oauth_provider 
                        ? `MANAGED BY ${oauth_provider.toUpperCase()} ACCOUNT` 
                        : 'CHANGE PASSWORD'
                      }
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Delete Account Button */}
            <TouchableOpacity 
              style={[
                styles.deleteAccountButton,
                { backgroundColor: theme.colors.error }
              ]} 
              onPress={handleDeleteAccount}
              disabled={deleteAccountLoading}
            >
              {deleteAccountLoading ? (
                <ActivityIndicator color={theme.colors.buttonText} size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.deleteAccountButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
                    DELETE ACCOUNT
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <View style={[styles.securityInfoPanel, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              <View style={styles.securityInfoHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.securityInfoTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                  SECURITY RECOMMENDATIONS
                </Text>
              </View>
              
              <View style={styles.securityInfoContent}>
                <View style={[styles.securityTip, { borderBottomColor: theme.colors.border }]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={[styles.securityTipText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    Use a unique password for increased security
                  </Text>
                </View>
                
                <View style={[styles.securityTip, { borderBottomColor: theme.colors.border }]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={[styles.securityTipText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    Include uppercase, lowercase, numbers and special characters
                  </Text>
                </View>
                
                <View style={styles.securityTip}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={[styles.securityTipText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    Change your password regularly for maximum security
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Status Modal Component
const StatusModal = ({ visible, message, type, onClose, theme }) => {
  if (!visible) return null;
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface },
          type === 'success' ? 
            { borderLeftColor: theme.colors.success } : 
            { borderLeftColor: theme.colors.error }
        ]}>
          <Ionicons 
            name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={type === 'success' ? theme.colors.success : theme.colors.error} 
          />
          <Text style={[styles.modalText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>{message}</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  // Header styles
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  
  // Main layout
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  
  // Profile header
  profileHeader: {
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeaderGradient: {
    padding: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // placeholder color while loading
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelProgress: {
    flex: 1,
  },
  levelProgressText: {
    fontSize: 10,
    marginBottom: 4,
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
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  securityIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  securityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  securityText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  idText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  tabContent: {
    marginBottom: 16,
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
  
  // Stats Panel
  statsPanel: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 40) / 2,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionCardHeader: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // Settings Panel
  settingsPanel: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    letterSpacing: 0.5,
    marginRight: 10,
  },
  settingValue: {
    fontSize: 8,
    flexShrink: 1,
  },
  themeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  
  // Change Forms
  changeForm: {
    marginTop: 12,
  },
  settingInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  changeButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Password input
  passwordInputContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '30%',
    zIndex: 1,
  },
  
  // Security Info Panel
  securityInfoPanel: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  securityInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  securityInfoContent: {
    padding: 16,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  securityTipText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  
  // Buttons
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginVertical: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  
  // Delete Account Button
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginVertical: 16,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  modalCloseButton: {
    marginLeft: 10,
  },
});

export default ProfileScreen;
