// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  Animated
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, logout } from '../../store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';

// Import profile service to handle API calls
import { changeUsername, changeEmail, changePassword, getAvatarUrl } from '../../api/profileService';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme(); // Access theme context
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  // Get user data from Redux store
  const {
    userId,
    username,
    email,
    xp,
    level,
    coins,
    achievements = [],
    currentAvatar,
    nameColor,
    purchasedItems,
    subscriptionActive,
    status
  } = useSelector((state) => state.user);
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Form state
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
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
  
  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);
  
  // Calculate XP to next level
  const calculateXpPercentage = () => {
    return calculateXpToNextLevel();
  };
  
  // Calculate XP required for a given level
  const xpRequiredForLevel = (level) => {
    if (level < 1) return 0;
    if (level === 1) return 0;
    
    if (level <= 30) {
      return 500 * (level - 1);
    } else if (level <= 60) {
      const base = 500 * 29; // XP for levels up to 30
      return base + 750 * (level - 30);
    } else if (level <= 100) {
      const base = 500 * 29 + 750 * 30; // XP for levels up to 60
      return base + 1000 * (level - 60);
    } else {
      const base = 500 * 29 + 750 * 30 + 1000 * 40; // XP for levels up to 100
      return base + 1500 * (level - 100);
    }
  };
  
  // Calculate percentage to next level
  const calculateXpToNextLevel = () => {
    // Get XP required for current level and next level
    const currentLevelXp = xpRequiredForLevel(level);
    const nextLevelXp = xpRequiredForLevel(level + 1);
    
    // Calculate how much XP we've earned in the current level
    const xpInCurrentLevel = xp - currentLevelXp;
    
    // Calculate how much XP is needed to reach the next level
    const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
    
    // Calculate percentage (capped at 100%)
    return Math.min(100, (xpInCurrentLevel / xpRequiredForNextLevel) * 100);
  };
  
  const xpPercentage = calculateXpPercentage();

  // Get user avatar URL
  const getProfilePicUrl = () => {
    if (!currentAvatar) {
      return null; // Will use the default local asset
    }

    // Use the helper function to get a properly formatted avatar URL
    const avatarUrl = getAvatarUrl(currentAvatar);
    return avatarUrl;
  };
  
  // Fetch user data
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, userId]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchUserData(userId)).then(() => {
      setRefreshing(false);
    });
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
            navigation.navigate('Login');
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
      dispatch(fetchUserData(userId));
      
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
  
  // Handle email change
  const handleChangeEmail = async () => {
    if (!newEmail) {
      showStatusMessage('Please enter a new email', 'error');
      return;
    }
    
    // Basic validation
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      showStatusMessage('Please enter a valid email address', 'error');
      return;
    }
    
    setEmailLoading(true);
    
    try {
      await changeEmail(userId, newEmail);
      
      showStatusMessage('Email updated successfully!');
      setShowChangeEmail(false);
      setNewEmail('');
      
      // Refresh user data
      dispatch(fetchUserData(userId));
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error changing email:', error);
      showStatusMessage(error.message || 'Failed to update email. Please try again.', 'error');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setEmailLoading(false);
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateY }]
            }
          ]}
        >
          <LinearGradient
            colors={theme.colors.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.avatarContainer}>
              {/* Use properly formatted avatar URL */}
              {!avatarError && currentAvatar ? (
                <Image 
                  source={{ uri: getProfilePicUrl() }}
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
            
            <View style={styles.userInfo}>
              <Text style={styles.username}>{username}</Text>
              
              <View style={styles.levelContainer}>
                <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.levelText}>{level}</Text>
                </View>
                
                <View style={styles.xpContainer}>
                  <View style={styles.xpBar}>
                    <View 
                      style={[
                        styles.xpProgress, 
                        { 
                          width: `${xpPercentage}%`,
                          backgroundColor: theme.colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.xpText}>{xp} XP</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="wallet-outline" size={18} color="#FFD700" />
                  <Text style={styles.statText}>{coins}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="trophy-outline" size={18} color="#FFD700" />
                  <Text style={styles.statText}>{achievements.length}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="star-outline" size={18} color="#FFD700" />
                  <Text style={styles.statText}>{purchasedItems.length}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Tabs Navigation */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && [styles.activeTab, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'account' && [styles.activeTab, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setActiveTab('account')}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && [styles.activeTab, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <LinearGradient
                colors={theme.colors.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardHeader}
              >
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>User Profile</Text>
              </LinearGradient>
              
              <View style={styles.cardBody}>
                <View style={[styles.profileDetail, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Username:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{username}</Text>
                </View>
                
                <View style={[styles.profileDetail, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Email:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{email}</Text>
                </View>
                
                <View style={[styles.profileDetail, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Level:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{level}</Text>
                </View>
                
                <View style={[styles.profileDetail, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>XP:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{xp}</Text>
                </View>
                
                <View style={[styles.profileDetail, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Coins:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>{coins}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Subscription:</Text>
                  <Text style={[
                    styles.detailValue, 
                    subscriptionActive ? [styles.activeSubscription, { color: theme.colors.success }] : [styles.inactiveSubscription, { color: theme.colors.subtext }]
                  ]}>
                    {subscriptionActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <LinearGradient
                colors={theme.colors.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardHeader}
              >
                <Ionicons name="trophy-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Achievements</Text>
              </LinearGradient>
              
              <View style={styles.cardBody}>
                {achievements.length > 0 ? (
                  <>
                    <Text style={[styles.achievementsText, { color: theme.colors.text }]}>
                      You have unlocked {achievements.length} achievements!
                    </Text>
                    <TouchableOpacity 
                      style={[styles.viewMoreButton, { backgroundColor: `${theme.colors.primary}20` }]} 
                      onPress={goToAchievements}
                    >
                      <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>View All Achievements</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                    Complete quizzes and challenges to earn achievements!
                  </Text>
                )}
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <LinearGradient
                colors={theme.colors.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardHeader}
              >
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Shop Items</Text>
              </LinearGradient>
              
              <View style={styles.cardBody}>
                {purchasedItems.length > 0 ? (
                  <>
                    <Text style={[styles.itemsText, { color: theme.colors.text }]}>
                      You have purchased {purchasedItems.length} items from the shop!
                    </Text>
                    <TouchableOpacity 
                      style={[styles.viewMoreButton, { backgroundColor: `${theme.colors.primary}20` }]} 
                      onPress={goToShop}
                    >
                      <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>Visit Shop</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                    Visit the shop to purchase avatars and other items!
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'account' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <LinearGradient
                colors={theme.colors.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardHeader}
              >
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Account Settings</Text>
              </LinearGradient>
              
              <View style={styles.cardBody}>
                {/* Change Username */}
                <View style={[styles.settingSection, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.settingHeader}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Username</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.subtext }]}>{username}</Text>
                  </View>
                  
                  {showChangeUsername ? (
                    <View style={styles.changeForm}>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                        placeholder="New username"
                        placeholderTextColor={theme.colors.subtext}
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                        editable={!usernameLoading}
                      />
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                          onPress={handleChangeUsername}
                          disabled={usernameLoading}
                        >
                          {usernameLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.buttonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                          onPress={() => {
                            setShowChangeUsername(false);
                            setNewUsername('');
                          }}
                          disabled={usernameLoading}
                        >
                          <Text style={[styles.cancelText, { color: theme.colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.changeButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => setShowChangeUsername(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Username</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Change Email */}
                <View style={[styles.settingSection, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.settingHeader}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Email</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.subtext }]}>{email}</Text>
                  </View>
                  
                  {showChangeEmail ? (
                    <View style={styles.changeForm}>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                        placeholder="New email address"
                        placeholderTextColor={theme.colors.subtext}
                        value={newEmail}
                        onChangeText={setNewEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!emailLoading}
                      />
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                          onPress={handleChangeEmail}
                          disabled={emailLoading}
                        >
                          {emailLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.buttonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                          onPress={() => {
                            setShowChangeEmail(false);
                            setNewEmail('');
                          }}
                          disabled={emailLoading}
                        >
                          <Text style={[styles.cancelText, { color: theme.colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.changeButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => setShowChangeEmail(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Change Password */}
                <View style={[styles.settingSection, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.settingHeader}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Password</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.subtext }]}>••••••••</Text>
                  </View>
                  
                  {showChangePassword ? (
                    <View style={styles.changeForm}>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                          placeholder="Current password"
                          placeholderTextColor={theme.colors.subtext}
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
                            name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={theme.colors.subtext}
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                          placeholder="New password"
                          placeholderTextColor={theme.colors.subtext}
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
                            name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={theme.colors.subtext}
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                          placeholder="Confirm new password"
                          placeholderTextColor={theme.colors.subtext}
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
                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={theme.colors.subtext}
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                          onPress={handleChangePassword}
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.buttonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                          onPress={() => {
                            setShowChangePassword(false);
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          disabled={passwordLoading}
                        >
                          <Text style={[styles.cancelText, { color: theme.colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.changeButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => setShowChangePassword(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Password</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Theme Settings (New) */}
                <View style={styles.settingSection}>
                  <View style={styles.settingHeader}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Theme Settings</Text>
                    <Text style={[styles.settingValue, { color: theme.colors.primary }]}>
                      {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.changeButton, { backgroundColor: theme.colors.primary }]}
                    onPress={goToThemeSettings}
                  >
                    <Ionicons name="color-palette" size={16} color="#FFFFFF" />
                    <Text style={styles.changeButtonText}>Customize App Theme</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.supportButton, { backgroundColor: theme.colors.secondary }]} 
              onPress={goToSupport}
            >
              <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'achievements' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <LinearGradient
                colors={theme.colors.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardHeader}
              >
                <Ionicons name="trophy-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Your Achievements</Text>
              </LinearGradient>
              
              <View style={styles.cardBody}>
                {achievements.length > 0 ? (
                  <>
                    <Text style={[styles.achievementsText, { color: theme.colors.text }]}>
                      You have unlocked {achievements.length} achievements!
                    </Text>
                    <TouchableOpacity 
                      style={[styles.viewMoreButton, { backgroundColor: `${theme.colors.primary}20` }]} 
                      onPress={goToAchievements}
                    >
                      <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>View All Achievements</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                    Complete quizzes and challenges to earn achievements!
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
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
          type === 'success' ? [styles.successModal, { borderLeftColor: theme.colors.success }] : [styles.errorModal, { borderLeftColor: theme.colors.error }]
        ]}>
          <Ionicons 
            name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={type === 'success' ? theme.colors.success : theme.colors.error} 
          />
          <Text style={[styles.modalText, { color: theme.colors.text }]}>{message}</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  
  // Header styles
  header: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 25,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Background color while loading
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpContainer: {
    flex: 1,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  statText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
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
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Content styles
  tabContent: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 16,
  },
  
  // Profile details
  profileDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Achievements & Items
  achievementsText: {
    fontSize: 14,
    marginBottom: 16,
  },
  itemsText: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  
  // Account settings
  settingSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Forms
  changeForm: {
    marginTop: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '25%',
    zIndex: 1,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Buttons
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 16,
  },
  supportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  modalCloseButton: {
    marginLeft: 10,
  },
});

export default ProfileScreen;
