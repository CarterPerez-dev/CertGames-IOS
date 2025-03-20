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
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, logout } from '../../store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';

// Import our shared UI components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
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
  const [statusType, setStatusType] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Refs for content elements
  const scrollViewRef = useRef(null);
  
  // Fetch user data
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, userId]);
  
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
  const xpForNextLevel = xpRequiredForLevel(level + 1) - xp;

  // Get user avatar URL
  const getProfilePicUrl = () => {
    if (!currentAvatar) {
      return null; // Will use the default local asset
    }

    // Logic to get avatar URL based on the currentAvatar value
    const baseUrl = 'https://certgames.com'; // Replace with your actual domain
    return `${baseUrl}/avatars/${currentAvatar}.png`;
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchUserData(userId)).then(() => {
      setRefreshing(false);
    });
  };
  
  // Handle logout
  const handleLogout = async () => {
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
    
    // More comprehensive validation can be added here
    
    setUsernameLoading(true);
    
    try {
      await changeUsername(userId, newUsername);
      
      showStatusMessage('Username updated successfully!');
      setShowChangeUsername(false);
      setNewUsername('');
      
      // Refresh user data
      dispatch(fetchUserData(userId));
    } catch (error) {
      console.error('Error changing username:', error);
      showStatusMessage(error.message || 'Failed to update username. Please try again.', 'error');
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
    } catch (error) {
      console.error('Error changing email:', error);
      showStatusMessage(error.message || 'Failed to update email. Please try again.', 'error');
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
      
    } catch (error) {
      console.error('Error changing password:', error);
      showStatusMessage(error.message || 'Failed to update password. Please try again.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  // Navigate to other screens
  const goToAchievements = () => {
    navigation.navigate('Achievements');
  };
  
  const goToShop = () => {
    navigation.navigate('Shop');
  };
  
  const goToSupport = () => {
    navigation.navigate('Support');
  };
  
  const goToThemeSettings = () => {
    navigation.navigate('ThemeSettings');
  };
  
  // Handle avatar image error
  const handleAvatarError = () => {
    console.log('Avatar image failed to load');
    setAvatarError(true);
  };
  
  // Custom tab indicator style
  const getTabIndicatorStyle = (tabName) => {
    return {
      height: 3,
      width: activeTab === tabName ? '100%' : 0,
      backgroundColor: theme.primary,
      position: 'absolute',
      bottom: 0,
      borderRadius: 1.5,
    };
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusModal 
        visible={showStatusModal}
        message={statusMessage}
        type={statusType}
        onClose={() => setShowStatusModal(false)}
        theme={theme}
      />
      
      {/* Background decorative elements */}
      <View style={styles.backgroundDecorations}>
        <LinearGradient
          colors={[theme.primaryGradient[0] + '20', 'transparent']}
          style={styles.topLeftBlur}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[theme.secondaryGradient[0] + '15', 'transparent']}
          style={styles.topRightBlur}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        {/* Custom header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.surfaceAlt }]}
              onPress={goToThemeSettings}
            >
              <Ionicons name="color-palette-outline" size={20} color={theme.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.surfaceAlt }]}
              onPress={goToSupport}
            >
              <Ionicons name="help-circle-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          {/* Profile Card */}
          <View style={styles.profileCardContainer}>
            <Card
              gradient="primary"
              elevation={8}
              style={styles.profileCard}
            >
              <View style={styles.profileCardContent}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={theme.primaryGradient}
                    style={styles.avatarBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {!avatarError && currentAvatar ? (
                      <Image 
                        source={{ uri: getProfilePicUrl() }}
                        style={styles.avatar}
                        onError={handleAvatarError}
                      />
                    ) : (
                      <View style={styles.placeholderAvatar}>
                        <Text style={styles.avatarText}>
                          {username?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.editAvatarButton}
                      onPress={goToShop}
                    >
                      <BlurView intensity={80} tint="light" style={styles.editAvatarBlur}>
                        <Ionicons name="camera" size={14} color="#FFF" />
                      </BlurView>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
                
                {/* User info */}
                <View style={styles.userInfoContainer}>
                  <Text 
                    style={[
                      styles.usernameText, 
                      { 
                        color: nameColor || theme.text,
                        textShadowColor: nameColor ? `${nameColor}50` : 'transparent'
                      }
                    ]}
                  >
                    {username}
                  </Text>
                  
                  <Text style={[styles.emailText, { color: theme.textSecondary }]}>
                    {email}
                  </Text>
                  
                  {/* Level & XP Progress */}
                  <View style={styles.levelContainer}>
                    <View style={styles.levelBadgeRow}>
                      <LinearGradient
                        colors={theme.primaryGradient}
                        style={styles.levelBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.levelNumber}>{level}</Text>
                      </LinearGradient>
                      
                      <Text style={[styles.levelText, { color: theme.text }]}>
                        Level {level}
                      </Text>
                      
                      <Text style={[styles.xpNextLevel, { color: theme.textSecondary }]}>
                        {xpForNextLevel} XP to Level {level + 1}
                      </Text>
                    </View>
                    
                    <View style={[styles.xpBarContainer, { backgroundColor: theme.surfaceAlt + '70' }]}>
                      <View 
                        style={[
                          styles.xpBarFill,
                          { width: `${xpPercentage}%`, backgroundColor: theme.primary }
                        ]}
                      />
                    </View>
                  </View>
                  
                  {/* Stats row */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <View style={[styles.statIconContainer, { backgroundColor: theme.primaryGradient[0] + '30' }]}>
                        <Ionicons name="flash" size={16} color={theme.primaryGradient[0]} />
                      </View>
                      <View style={styles.statTextContainer}>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {xp.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total XP</Text>
                      </View>
                    </View>
                    
                    <View style={styles.statItem}>
                      <View style={[styles.statIconContainer, { backgroundColor: theme.secondaryGradient[0] + '30' }]}>
                        <Ionicons name="wallet" size={16} color={theme.secondaryGradient[0]} />
                      </View>
                      <View style={styles.statTextContainer}>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {coins.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Coins</Text>
                      </View>
                    </View>
                    
                    <View style={styles.statItem}>
                      <View style={[styles.statIconContainer, { backgroundColor: theme.accentGradient[0] + '30' }]}>
                        <Ionicons name="trophy" size={16} color={theme.accentGradient[0]} />
                      </View>
                      <View style={styles.statTextContainer}>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {achievements.length}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Achievements</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </View>
          
          {/* Tabs Navigation */}
          <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              style={styles.tab}
              onPress={() => setActiveTab('overview')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: activeTab === 'overview' ? theme.primary : theme.textSecondary }
                ]}
              >
                Overview
              </Text>
              <View style={getTabIndicatorStyle('overview')} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tab}
              onPress={() => setActiveTab('account')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: activeTab === 'account' ? theme.primary : theme.textSecondary }
                ]}
              >
                Account
              </Text>
              <View style={getTabIndicatorStyle('account')} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tab}
              onPress={() => setActiveTab('achievements')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: activeTab === 'achievements' ? theme.primary : theme.textSecondary }
                ]}
              >
                Achievements
              </Text>
              <View style={getTabIndicatorStyle('achievements')} />
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'overview' && (
              <View style={styles.overviewContent}>
                {/* Subscription status card */}
                <Card 
                  style={styles.subscriptionCard}
                  elevation={4}
                  gradient={subscriptionActive ? 'accent' : false}
                  gradientColors={
                    subscriptionActive 
                      ? theme.accentGradient
                      : [theme.surfaceAlt, theme.surface]
                  }
                >
                  <View style={styles.subscriptionContent}>
                    <View style={styles.subscriptionTextContainer}>
                      <Ionicons 
                        name={subscriptionActive ? "shield-checkmark" : "shield-outline"} 
                        size={24} 
                        color={subscriptionActive ? "#FFFFFF" : theme.textSecondary} 
                      />
                      <View style={styles.subscriptionTextBlock}>
                        <Text style={[
                          styles.subscriptionTitle, 
                          { color: subscriptionActive ? "#FFFFFF" : theme.text }
                        ]}>
                          {subscriptionActive ? "Premium Active" : "Free Plan"}
                        </Text>
                        <Text style={[
                          styles.subscriptionDescription,
                          { color: subscriptionActive ? "#FFFFFF" : theme.textSecondary }
                        ]}>
                          {subscriptionActive 
                            ? "You have access to all premium features" 
                            : "Upgrade to access premium features"}
                        </Text>
                      </View>
                    </View>
                    
                    {!subscriptionActive && (
                      <Button
                        title="Upgrade"
                        rightIcon="chevron-forward"
                        size="small"
                        onPress={() => navigation.navigate('Shop')}
                        style={styles.upgradeButton}
                      />
                    )}
                  </View>
                </Card>
                
                {/* Quick actions */}
                <View style={styles.quickActions}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Quick Actions
                  </Text>
                  
                  <View style={styles.actionCardsContainer}>
                    <View style={styles.actionCardWrapper}>
                      <Card
                        gradient="primary"
                        onPress={goToAchievements}
                        elevation={4}
                        style={styles.actionCard}
                      >
                        <View style={styles.actionCardContent}>
                          <Ionicons name="trophy" size={24} color="#FFF" />
                          <Text style={styles.actionCardTitle}>Achievements</Text>
                          <Text style={styles.actionCardDescription}>
                            View your earned badges
                          </Text>
                        </View>
                      </Card>
                    </View>
                    
                    <View style={styles.actionCardWrapper}>
                      <Card
                        gradient="secondary"
                        onPress={goToShop}
                        elevation={4}
                        style={styles.actionCard}
                      >
                        <View style={styles.actionCardContent}>
                          <Ionicons name="cart" size={24} color="#FFF" />
                          <Text style={styles.actionCardTitle}>Shop</Text>
                          <Text style={styles.actionCardDescription}>
                            Spend your coins
                          </Text>
                        </View>
                      </Card>
                    </View>
                    
                    <View style={styles.actionCardWrapper}>
                      <Card
                        gradient="accent"
                        onPress={goToSupport}
                        elevation={4}
                        style={styles.actionCard}
                      >
                        <View style={styles.actionCardContent}>
                          <Ionicons name="help-circle" size={24} color="#FFF" />
                          <Text style={styles.actionCardTitle}>Support</Text>
                          <Text style={styles.actionCardDescription}>
                            Get help with any issues
                          </Text>
                        </View>
                      </Card>
                    </View>
                  </View>
                </View>
                
                {/* Recent achievements */}
                <View style={styles.recentAchievements}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Recent Achievements
                    </Text>
                    <TouchableOpacity onPress={goToAchievements}>
                      <Text style={[styles.viewAllText, { color: theme.primary }]}>
                        View All
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {achievements.length > 0 ? (
                    <View style={styles.achievementsList}>
                      {/* Show just 3 most recent achievements */}
                      {[...achievements].slice(0, 3).map((achievement, index) => (
                        <Card
                          key={`achievement-${index}`}
                          style={styles.achievementCard}
                          elevation={3}
                        >
                          <View style={styles.achievementCardContent}>
                            <View 
                              style={[
                                styles.achievementIconContainer,
                                { backgroundColor: theme.primary + '20' }
                              ]}
                            >
                              <Ionicons name="trophy" size={22} color={theme.primary} />
                            </View>
                            
                            <View style={styles.achievementTextContainer}>
                              <Text 
                                style={[
                                  styles.achievementTitle,
                                  { color: theme.text }
                                ]}
                                numberOfLines={1}
                              >
                                {achievement}
                              </Text>
                              <Text 
                                style={[
                                  styles.achievementDescription,
                                  { color: theme.textSecondary }
                                ]}
                                numberOfLines={1}
                              >
                                Earned achievement
                              </Text>
                            </View>
                            
                            <Ionicons 
                              name="chevron-forward" 
                              size={16} 
                              color={theme.textSecondary} 
                            />
                          </View>
                        </Card>
                      ))}
                    </View>
                  ) : (
                    <Card style={styles.emptyStateCard}>
                      <View style={styles.emptyStateContent}>
                        <Ionicons name="trophy-outline" size={40} color={theme.textSecondary} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                          Complete challenges to earn achievements
                        </Text>
                      </View>
                    </Card>
                  )}
                </View>
                
                {/* Logout button */}
                <View style={styles.logoutContainer}>
                  <Button
                    title="Logout"
                    variant="outline"
                    leftIcon="log-out-outline"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                  />
                </View>
              </View>
            )}
            
            {activeTab === 'account' && (
              <View style={styles.accountContent}>
                {/* Account Settings Card */}
                <Card style={styles.settingsCard}>
                  <View style={styles.settingsCardHeader}>
                    <Ionicons name="person-circle-outline" size={22} color={theme.primary} />
                    <Text style={[styles.settingsCardTitle, { color: theme.text }]}>
                      Profile Settings
                    </Text>
                  </View>
                  
                  <View style={styles.settingsCardContent}>
                    {/* Username setting */}
                    <View style={[styles.settingSection, { borderBottomColor: theme.border }]}>
                      <View style={styles.settingHeader}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>Username</Text>
                        <Text 
                          style={[
                            styles.settingValue, 
                            { 
                              color: nameColor || theme.textSecondary,
                              fontWeight: nameColor ? 'bold' : 'normal'
                            }
                          ]}
                        >
                          {username}
                        </Text>
                      </View>
                      
                      {showChangeUsername ? (
                        <View style={styles.changeForm}>
                          <TextInput
                            style={[
                              styles.input, 
                              { 
                                backgroundColor: theme.surfaceAlt, 
                                color: theme.text,
                                borderColor: theme.border
                              }
                            ]}
                            placeholder="New username"
                            placeholderTextColor={theme.textSecondary}
                            value={newUsername}
                            onChangeText={setNewUsername}
                            autoCapitalize="none"
                            editable={!usernameLoading}
                          />
                          
                          <View style={styles.formButtons}>
                            <Button
                              title="Save"
                              variant="primary"
                              loading={usernameLoading}
                              onPress={handleChangeUsername}
                              style={styles.saveButton}
                            />
                            
                            <Button
                              title="Cancel"
                              variant="outline"
                              onPress={() => {
                                setShowChangeUsername(false);
                                setNewUsername('');
                              }}
                              disabled={usernameLoading}
                              style={styles.cancelButton}
                            />
                          </View>
                        </View>
                      ) : (
                        <Button
                          title="Change Username"
                          variant="primary"
                          size="small"
                          leftIcon="create-outline"
                          onPress={() => setShowChangeUsername(true)}
                          style={styles.changeButton}
                        />
                      )}
                    </View>
                    
                    {/* Email setting */}
                    <View style={[styles.settingSection, { borderBottomColor: theme.border }]}>
                      <View style={styles.settingHeader}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>Email</Text>
                        <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{email}</Text>
                      </View>
                      
                      {showChangeEmail ? (
                        <View style={styles.changeForm}>
                          <TextInput
                            style={[
                              styles.input, 
                              { 
                                backgroundColor: theme.surfaceAlt, 
                                color: theme.text,
                                borderColor: theme.border
                              }
                            ]}
                            placeholder="New email address"
                            placeholderTextColor={theme.textSecondary}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!emailLoading}
                          />
                          
                          <View style={styles.formButtons}>
                            <Button
                              title="Save"
                              variant="primary"
                              loading={emailLoading}
                              onPress={handleChangeEmail}
                              style={styles.saveButton}
                            />
                            
                            <Button
                              title="Cancel"
                              variant="outline"
                              onPress={() => {
                                setShowChangeEmail(false);
                                setNewEmail('');
                              }}
                              disabled={emailLoading}
                              style={styles.cancelButton}
                            />
                          </View>
                        </View>
                      ) : (
                        <Button
                          title="Change Email"
                          variant="primary"
                          size="small"
                          leftIcon="create-outline"
                          onPress={() => setShowChangeEmail(true)}
                          style={styles.changeButton}
                        />
                      )}
                    </View>
                    
                    {/* Password setting */}
                    <View style={styles.settingSection}>
                      <View style={styles.settingHeader}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>Password</Text>
                        <Text style={[styles.settingValue, { color: theme.textSecondary }]}>••••••••</Text>
                      </View>
                      
                      {showChangePassword ? (
                        <View style={styles.changeForm}>
                          <View style={styles.passwordInputWrapper}>
                            <TextInput
                              style={[
                                styles.input, 
                                { 
                                  backgroundColor: theme.surfaceAlt, 
                                  color: theme.text,
                                  borderColor: theme.border
                                }
                              ]}
                              placeholder="Current password"
                              placeholderTextColor={theme.textSecondary}
                              value={oldPassword}
                              onChangeText={setOldPassword}
                              secureTextEntry={!showOldPassword}
                              autoCapitalize="none"
                              editable={!passwordLoading}
                            />
                            <TouchableOpacity
                              style={[styles.eyeButton, { backgroundColor: theme.surface }]}
                              onPress={() => setShowOldPassword(!showOldPassword)}
                            >
                              <Ionicons
                                name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.passwordInputWrapper}>
                            <TextInput
                              style={[
                                styles.input, 
                                { 
                                  backgroundColor: theme.surfaceAlt, 
                                  color: theme.text,
                                  borderColor: theme.border
                                }
                              ]}
                              placeholder="New password"
                              placeholderTextColor={theme.textSecondary}
                              value={newPassword}
                              onChangeText={setNewPassword}
                              secureTextEntry={!showNewPassword}
                              autoCapitalize="none"
                              editable={!passwordLoading}
                            />
                            <TouchableOpacity
                              style={[styles.eyeButton, { backgroundColor: theme.surface }]}
                              onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                              <Ionicons
                                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.passwordInputWrapper}>
                            <TextInput
                              style={[
                                styles.input, 
                                { 
                                  backgroundColor: theme.surfaceAlt, 
                                  color: theme.text,
                                  borderColor: theme.border
                                }
                              ]}
                              placeholder="Confirm new password"
                              placeholderTextColor={theme.textSecondary}
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry={!showConfirmPassword}
                              autoCapitalize="none"
                              editable={!passwordLoading}
                            />
                            <TouchableOpacity
                              style={[styles.eyeButton, { backgroundColor: theme.surface }]}
                              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              <Ionicons
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.formButtons}>
                            <Button
                              title="Save"
                              variant="primary"
                              loading={passwordLoading}
                              onPress={handleChangePassword}
                              style={styles.saveButton}
                            />
                            
                            <Button
                              title="Cancel"
                              variant="outline"
                              onPress={() => {
                                setShowChangePassword(false);
                                setOldPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                              }}
                              disabled={passwordLoading}
                              style={styles.cancelButton}
                            />
                          </View>
                        </View>
                      ) : (
                        <Button
                          title="Change Password"
                          variant="primary"
                          size="small"
                          leftIcon="create-outline"
                          onPress={() => setShowChangePassword(true)}
                          style={styles.changeButton}
                        />
                      )}
                    </View>
                  </View>
                </Card>
                
                {/* Appearance Settings */}
                <Card
                  style={styles.appearanceCard}
                  onPress={goToThemeSettings}
                >
                  <View style={styles.appearanceCardContent}>
                    <View style={styles.appearanceTextContent}>
                      <View style={styles.appearanceIconContainer}>
                        <LinearGradient
                          colors={theme.primaryGradient}
                          style={styles.appearanceIconGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name="color-palette" size={22} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                      
                      <View style={styles.appearanceTextContainer}>
                        <Text style={[styles.appearanceTitle, { color: theme.text }]}>
                          Appearance Settings
                        </Text>
                        <Text style={[styles.appearanceDescription, { color: theme.textSecondary }]}>
                          Change app theme and colors
                        </Text>
                      </View>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>
                </Card>
                
                {/* Support Card */}
                <Card
                  style={styles.supportCard}
                  onPress={goToSupport}
                >
                  <View style={styles.supportCardContent}>
                    <View style={styles.supportTextContent}>
                      <View style={styles.supportIconContainer}>
                        <LinearGradient
                          colors={theme.secondaryGradient}
                          style={styles.supportIconGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name="help-circle" size={22} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                      
                      <View style={styles.supportTextContainer}>
                        <Text style={[styles.supportTitle, { color: theme.text }]}>
                          Support & Help
                        </Text>
                        <Text style={[styles.supportDescription, { color: theme.textSecondary }]}>
                          Get assistance with any issues
                        </Text>
                      </View>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>
                </Card>
                
                {/* Logout button */}
                <View style={styles.logoutContainer}>
                  <Button
                    title="Logout"
                    variant="outline"
                    leftIcon="log-out-outline"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                  />
                </View>
              </View>
            )}
            
            {activeTab === 'achievements' && (
              <View style={styles.achievementsContent}>
                <Card style={styles.achievementsStatsCard}>
                  <LinearGradient
                    colors={[...theme.primaryGradient].reverse()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.achievementsStatsGradient}
                  >
                    <View style={styles.achievementsStatsContent}>
                      <View style={styles.achievementsStatsIconContainer}>
                        <Ionicons name="trophy" size={40} color="#FFFFFF" />
                      </View>
                      
                      <View style={styles.achievementsStatsTextContainer}>
                        <Text style={styles.achievementsStatsTitle}>
                          {achievements.length} Achievements
                        </Text>
                        <Text style={styles.achievementsStatsDescription}>
                          Keep up the great work!
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Card>
                
                <Button
                  title="View All Achievements"
                  variant="primary"
                  rightIcon="arrow-forward"
                  onPress={goToAchievements}
                  style={styles.viewAchievementsButton}
                />
                
                <View style={styles.achievementsListContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent Achievements
                  </Text>
                  
                  {achievements.length > 0 ? (
                    <View style={styles.recentAchievementsList}>
                      {/* Show the 5 most recent achievements */}
                      {[...achievements].slice(0, 5).map((achievement, index) => (
                        <View key={`achievement-full-${index}`}>
                          <Card style={styles.achievementFullCard}>
                            <View style={styles.achievementFullCardContent}>
                              <LinearGradient
                                colors={index % 2 === 0 ? theme.primaryGradient : theme.secondaryGradient}
                                style={styles.achievementFullIconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <Ionicons name="trophy" size={24} color="#FFFFFF" />
                              </LinearGradient>
                              
                              <View style={styles.achievementFullTextContainer}>
                                <Text 
                                  style={[styles.achievementFullTitle, { color: theme.text }]}
                                  numberOfLines={1}
                                >
                                  {achievement}
                                </Text>
                                <Text 
                                  style={[styles.achievementFullDescription, { color: theme.textSecondary }]}
                                  numberOfLines={2}
                                >
                                  You've earned this achievement by completing challenges
                                </Text>
                              </View>
                            </View>
                          </Card>
                        </View>
                      ))}
                      
                      {achievements.length > 5 && (
                        <View style={styles.moreAchievementsContainer}>
                          <Text style={[styles.moreAchievementsText, { color: theme.textSecondary }]}>
                            + {achievements.length - 5} more achievements
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Card style={styles.emptyStateCard}>
                      <View style={styles.emptyStateContent}>
                        <Ionicons name="trophy-outline" size={40} color={theme.textSecondary} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                          No achievements yet. Complete challenges to earn badges!
                        </Text>
                      </View>
                    </Card>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
      <View style={styles.modalContainer}>
        <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
          <TouchableOpacity style={styles.modalBackground} onPress={onClose}>
            <View style={[
              styles.modalContent,
              type === 'success' 
                ? { backgroundColor: theme.success + 'DD' }
                : { backgroundColor: theme.danger + 'DD' }
            ]}>
              <Ionicons 
                name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color="#FFFFFF"
              />
              <Text style={styles.modalText}>{message}</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topLeftBlur: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.7,
  },
  topRightBlur: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.7,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  
  // Profile Card
  profileCardContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileCardContent: {
    padding: 20,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#2A2A2A',
  },
  placeholderAvatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  editAvatarBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emailText: {
    fontSize: 14,
    marginBottom: 16,
  },
  levelContainer: {
    width: '100%',
    marginBottom: 20,
  },
  levelBadgeRow: {
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
    marginRight: 8,
  },
  levelNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  xpNextLevel: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  xpBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
  },
  
  // Overview Tab
  overviewContent: {
    flex: 1,
  },
  subscriptionCard: {
    marginBottom: 20,
  },
  subscriptionContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionTextBlock: {
    marginLeft: 12,
  },
  subscriptionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  subscriptionDescription: {
    fontSize: 13,
  },
  upgradeButton: {
    marginLeft: 12,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCardWrapper: {
    width: '31%',
  },
  actionCard: {
    aspectRatio: 0.9,
  },
  actionCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  actionCardDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    textAlign: 'center',
  },
  recentAchievements: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementsList: {
    // Styles for achievements list
  },
  achievementCard: {
    marginBottom: 10,
  },
  achievementCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
  },
  emptyStateCard: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 100, 0.3)',
    backgroundColor: 'transparent',
  },
  emptyStateContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButton: {
    // Logout button styles
  },
  
  // Account Tab
  accountContent: {
    flex: 1,
  },
  settingsCard: {
    marginBottom: 20,
  },
  settingsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 100, 100, 0.3)',
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  settingsCardContent: {
    padding: 16,
  },
  settingSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
  },
  changeForm: {
    marginTop: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  
  // Appearance and Support Cards
  appearanceCard: {
    marginBottom: 20,
  },
  appearanceCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appearanceTextContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appearanceIconContainer: {
    marginRight: 16,
  },
  appearanceIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appearanceTextContainer: {
    // Text container styles
  },
  appearanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appearanceDescription: {
    fontSize: 13,
  },
  supportCard: {
    marginBottom: 24,
  },
  supportCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportTextContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIconContainer: {
    marginRight: 16,
  },
  supportIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTextContainer: {
    // Text container styles
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 13,
  },
  
  // Achievements Tab
  achievementsContent: {
    flex: 1,
  },
  achievementsStatsCard: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  achievementsStatsGradient: {
    padding: 20,
  },
  achievementsStatsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementsStatsIconContainer: {
    marginRight: 16,
  },
  achievementsStatsTextContainer: {
    // Text container styles
  },
  achievementsStatsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementsStatsDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewAchievementsButton: {
    marginBottom: 24,
  },
  achievementsListContainer: {
    marginBottom: 16,
  },
  recentAchievementsList: {
    // List styles
  },
  achievementFullCard: {
    marginBottom: 12,
  },
  achievementFullCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  achievementFullIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementFullTextContainer: {
    flex: 1,
  },
  achievementFullTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementFullDescription: {
    fontSize: 14,
  },
  moreAchievementsContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  moreAchievementsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Status Modal
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    maxWidth: '80%',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ProfileScreen;
