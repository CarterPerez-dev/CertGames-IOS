// src/screens/auth/CreateUsernameScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchUserData, logout } from '../../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
// Add these imports for the API client
import apiClient from '../../api/apiClient';
import { API } from '../../api/apiConfig';


const CreateUsernameScreen = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get userId and provider from route params
  const userId = route.params?.userId;
  const provider = route.params?.provider || 'oauth';
  
  useEffect(() => {
    if (!userId) {
      // If no userId, redirect to login
      navigation.navigate('Login');
    }
  }, [userId, navigation]);
  
  const validateUsername = (username) => {
    // Basic frontend validation
    if (!username || username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    
    if (username.length > 30) {
      return "Username must be no more than 30 characters long";
    }
    
    // Letters, numbers, underscores, dots, and dashes only
    if (!/^[A-Za-z0-9._-]+$/.test(username)) {
      return "Username can only contain letters, numbers, dots, underscores, and dashes";
    }
    
    // No leading/trailing dots, underscores, or dashes
    if (/^[._-]|[._-]$/.test(username)) {
      return "Username cannot start or end with dots, underscores, or dashes";
    }
    
    // No triple repeats
    if (/(.)\1{2,}/.test(username)) {
      return "Username cannot contain three identical consecutive characters";
    }
    
    return null; // No errors
  };

  const handleBackPress = () => {
    console.log("Back button pressed in CreateUsernameScreen");
    
    // Since this screen is often reached after OAuth and there might not be
    // any screen to go back to, we should handle this differently
    Alert.alert(
      "Cancel Setup",
      "Are you sure you want to cancel the username setup?",
      [
        {
          text: "Stay",
          style: "cancel"
        },
        {
          text: "Cancel Setup",
          style: "destructive",
          onPress: () => {
            // Log the user out
            dispatch(logout());
            
            // Reset the navigation stack to AuthNavigator, similar to renewal users
            navigation.reset({
              index: 0,
              routes: [{ name: 'Register' }],
            });
          } 
        }
      ]
    );
  };
  
  const handleSubmit = async () => {
    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Update username via API
      const response = await apiClient.post(API.USER.CHANGE_USERNAME, {
        userId: userId,
        newUsername: username.trim()
      });
      
      const data = response.data;
      
      // Success! Mark as submitted
      setSubmitted(true);
      
      // Save userId to secure storage
      await SecureStore.setItemAsync('userId', userId);
      
      // Fetch the updated user data
      const userDataAction = await dispatch(fetchUserData(userId));
      
      
      console.log("User data after username update:", {
        needsUsername: userDataAction.payload?.needsUsername || userDataAction.payload?.needs_username,
        fullUserData: userDataAction.payload      
       });
       
       
      // Navigate to subscription screen after a brief delay (to show success message)
      setTimeout(() => {
        // Make sure to explicitly set all flags
        navigation.navigate('SubscriptionIOS', {
          userId: userId,
          isOauthFlow: true,
          isNewUsername: true,
          provider: provider,
          message: `Welcome! You've successfully created your account with ${
            provider.charAt(0).toUpperCase() + provider.slice(1)
          }`
        });
      }, 1500);
    } catch (err) {
      console.error('Error setting username:', err);
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button - with updated handler for OAuth flow */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Ionicons name="arrow-back" size={22} color="#AAAAAA" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#121212', '#1a1a2e']}
            style={styles.gradientBackground}
          />
          
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  style={styles.logoBackground}
                >
                  <Ionicons name="game-controller" size={30} color="#FFFFFF" style={styles.logoIconSecondary} />
                  <View style={styles.logoIconPrimaryContainer}>
                    <Ionicons name="shield" size={18} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.headerTitle}>Choose Your Gamer Tag</Text>
              <Text style={styles.subtitle}>
                Create a unique username for your journey
              </Text>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Username Set Successfully!</Text>
                <Text style={styles.successText}>Preparing your dashboard...</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Username</Text>
                    <View style={styles.labelBadge}>
                      <Text style={styles.labelBadgeText}>Required</Text>
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Ionicons name="person" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Create a username"
                      placeholderTextColor="#AAAAAA"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      returnKeyType="done"
                      editable={!loading}
                      autoFocus
                    />
                    {username && !validateUsername(username) && (
                      <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.validIcon} />
                    )}
                  </View>
                  
                  <View style={styles.inputHint}>
                    <Ionicons name="information-circle" size={16} color="#AAAAAA" />
                    <Text style={styles.hintText}>
                      3-30 characters, letters, numbers, dots, underscores, dashes
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.buttonText}>Setting Username...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="trophy" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Set Username & Continue</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <View style={styles.noteContainer}>
                  <Ionicons name="information-circle" size={18} color="#AAAAAA" />
                  <Text style={styles.noteText}>
                    You can change your username later from your profile settings
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c15',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  // Back button styles - Added to match subscription screen
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 15,
    marginBottom: 10,
    zIndex: 10,
  },
  backButtonText: {
    color: '#AAAAAA',
    marginLeft: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#171a23',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2c3d',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(135deg, #6543cc, #8a58fc)',
    backgroundColor: '#6543cc',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
  },
  logoIconSecondary: {
    fontSize: 40,
  },
  logoIconPrimaryContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ff4c8b',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#171a23',
    shadowColor: '#ff4c8b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: '#6543cc',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: '#9da8b9',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4e4e',
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 25,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  labelBadge: {
    backgroundColor: '#6543cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  labelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f101a',
    borderRadius: 8,
    height: 55,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginHorizontal: 15,
    fontSize: 20,
  },
  input: {
    flex: 1,
    height: 55,
    color: '#FFFFFF',
    fontSize: 16,
  },
  validIcon: {
    marginRight: 15,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 5,
  },
  hintText: {
    color: '#9da8b9',
    fontSize: 12,
    marginLeft: 5,
  },
  submitButton: {
    backgroundColor: '#6543cc',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(101, 67, 204, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  disabledButton: {
    backgroundColor: 'rgba(101, 67, 204, 0.7)',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  noteText: {
    color: '#9da8b9',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2ebb77',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(46, 187, 119, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#9da8b9',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundImage: 'linear-gradient(90deg, #6543cc, #8a58fc, #6543cc)',
    backgroundSize: '200% 100%',
    animation: 'progress 1.5s linear infinite',
    transform: [{ translateX: '-100%' }],
  },
});

export default CreateUsernameScreen;
