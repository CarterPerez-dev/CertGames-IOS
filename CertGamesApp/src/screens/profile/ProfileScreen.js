// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, logout } from '../../store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

// Import profile service to handle API calls
import { changeUsername, changeEmail, changePassword } from '../../api/profileService';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
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

  // Get user avatar from purchased items
  const profilePicUrl = currentAvatar 
    ? `/avatars/${currentAvatar}.png` 
    : require('../../../assets/default-avatar.png');
  
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
  
  // Navigate to Achievements screen
  const goToAchievements = () => {
    navigation.navigate('Achievements');
  };
  
  // Navigate to Shop
  const goToShop = () => {
    navigation.navigate('Shop');
  };
  
  // Navigate to Support
  const goToSupport = () => {
    navigation.navigate('Support');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusModal 
        visible={showStatusModal}
        message={statusMessage}
        type={statusType}
        onClose={() => setShowStatusModal(false)}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={typeof profilePicUrl === 'string' ? { uri: profilePicUrl } : profilePicUrl} 
              style={styles.avatar}
            />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            
            <View style={styles.levelContainer}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <View style={styles.xpBar}>
                  <View style={[styles.xpProgress, { width: `${xpPercentage}%` }]} />
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
        </View>
        
        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'account' && styles.activeTab]}
            onPress={() => setActiveTab('account')}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={20} color="#6543CC" />
                <Text style={styles.cardTitle}>User Profile</Text>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Username:</Text>
                  <Text style={styles.detailValue}>{username}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{email}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Level:</Text>
                  <Text style={styles.detailValue}>{level}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>XP:</Text>
                  <Text style={styles.detailValue}>{xp}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Coins:</Text>
                  <Text style={styles.detailValue}>{coins}</Text>
                </View>
                
                <View style={styles.profileDetail}>
                  <Text style={styles.detailLabel}>Subscription:</Text>
                  <Text style={[
                    styles.detailValue, 
                    subscriptionActive ? styles.activeSubscription : styles.inactiveSubscription
                  ]}>
                    {subscriptionActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy-outline" size={20} color="#6543CC" />
                <Text style={styles.cardTitle}>Achievements</Text>
              </View>
              
              <View style={styles.cardBody}>
                {achievements.length > 0 ? (
                  <>
                    <Text style={styles.achievementsText}>
                      You have unlocked {achievements.length} achievements!
                    </Text>
                    <TouchableOpacity style={styles.viewMoreButton} onPress={goToAchievements}>
                      <Text style={styles.viewMoreText}>View All Achievements</Text>
                      <Ionicons name="chevron-forward" size={16} color="#6543CC" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.emptyStateText}>
                    Complete quizzes and challenges to earn achievements!
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="cart-outline" size={20} color="#6543CC" />
                <Text style={styles.cardTitle}>Shop Items</Text>
              </View>
              
              <View style={styles.cardBody}>
                {purchasedItems.length > 0 ? (
                  <>
                    <Text style={styles.itemsText}>
                      You have purchased {purchasedItems.length} items from the shop!
                    </Text>
                    <TouchableOpacity style={styles.viewMoreButton} onPress={goToShop}>
                      <Text style={styles.viewMoreText}>Visit Shop</Text>
                      <Ionicons name="chevron-forward" size={16} color="#6543CC" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.emptyStateText}>
                    Visit the shop to purchase avatars and other items!
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'account' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={20} color="#6543CC" />
                <Text style={styles.cardTitle}>Account Settings</Text>
              </View>
              
              <View style={styles.cardBody}>
                {/* Change Username */}
                <View style={styles.settingSection}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingTitle}>Username</Text>
                    <Text style={styles.settingValue}>{username}</Text>
                  </View>
                  
                  {showChangeUsername ? (
                    <View style={styles.changeForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="New username"
                        placeholderTextColor="#AAAAAA"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                        editable={!usernameLoading}
                      />
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={styles.saveButton}
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
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowChangeUsername(false);
                            setNewUsername('');
                          }}
                          disabled={usernameLoading}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => setShowChangeUsername(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Username</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Change Email */}
                <View style={styles.settingSection}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingTitle}>Email</Text>
                    <Text style={styles.settingValue}>{email}</Text>
                  </View>
                  
                  {showChangeEmail ? (
                    <View style={styles.changeForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="New email address"
                        placeholderTextColor="#AAAAAA"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!emailLoading}
                      />
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={styles.saveButton}
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
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowChangeEmail(false);
                            setNewEmail('');
                          }}
                          disabled={emailLoading}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => setShowChangeEmail(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Change Password */}
                <View style={styles.settingSection}>
                  <View style={styles.settingHeader}>
                    <Text style={styles.settingTitle}>Password</Text>
                    <Text style={styles.settingValue}>••••••••</Text>
                  </View>
                  
                  {showChangePassword ? (
                    <View style={styles.changeForm}>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="Current password"
                          placeholderTextColor="#AAAAAA"
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
                            color="#AAAAAA"
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="New password"
                          placeholderTextColor="#AAAAAA"
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
                            color="#AAAAAA"
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm new password"
                          placeholderTextColor="#AAAAAA"
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
                            color="#AAAAAA"
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.formButtons}>
                        <TouchableOpacity 
                          style={styles.saveButton}
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
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowChangePassword(false);
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          disabled={passwordLoading}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => setShowChangePassword(true)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeButtonText}>Change Password</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.supportButton} onPress={goToSupport}>
              <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'achievements' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy-outline" size={20} color="#6543CC" />
                <Text style={styles.cardTitle}>Your Achievements</Text>
              </View>
              
              <View style={styles.cardBody}>
                {achievements.length > 0 ? (
                  <>
                    <Text style={styles.achievementsText}>
                      You have unlocked {achievements.length} achievements!
                    </Text>
                    <TouchableOpacity style={styles.viewMoreButton} onPress={goToAchievements}>
                      <Text style={styles.viewMoreText}>View All Achievements</Text>
                      <Ionicons name="chevron-forward" size={16} color="#6543CC" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.emptyStateText}>
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
const StatusModal = ({ visible, message, type, onClose }) => {
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
          type === 'success' ? styles.successModal : styles.errorModal
        ]}>
          <Ionicons 
            name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={type === 'success' ? "#2ebb77" : "#ff4e4e"} 
          />
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6543CC',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#6543CC',
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
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#6543CC',
    borderRadius: 3,
  },
  xpText: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#6543CC',
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
    flex: 1,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardBody: {
    padding: 16,
  },
  
  // Profile details
  profileDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  detailLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeSubscription: {
    color: '#2ebb77',
  },
  inactiveSubscription: {
    color: '#AAAAAA',
  },
  
  // Achievements & Items
  achievementsText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  itemsText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 8,
  },
  viewMoreText: {
    color: '#6543CC',
    fontSize: 14,
    marginRight: 4,
  },
  
  // Account settings
  settingSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6543CC',
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Forms
  changeForm: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
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
    backgroundColor: '#6543CC',
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Buttons
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    paddingVertical: 12,
    borderRadius: 8,
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
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
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
  successModal: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ebb77',
  },
  errorModal: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4e4e',
  },
  modalText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  modalCloseButton: {
    marginLeft: 10,
  },
});

export default ProfileScreen;
