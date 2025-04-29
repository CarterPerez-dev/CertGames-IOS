// src/screens/auth/CreateUsernameScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchUserData, logout } from '../../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../api/apiClient';
import { API } from '../../api/apiConfig';

const { width, height } = Dimensions.get('window');

const CreateUsernameScreen = () => {
  // Core state variables - preserved exactly
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get userId and provider from route params - preserved exactly
  const userId = route.params?.userId;
  const provider = route.params?.provider || 'oauth';
  
  // Run animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Success animation
  const runSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ]).start();
  };
  
  // Redirect if no userId - preserved exactly
  useEffect(() => {
    if (!userId) {
      navigation.navigate('Login');
    }
  }, [userId, navigation]);
  
  // Username validation function - preserved exactly
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


  // Submit handler - preserved exactly
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
      runSuccessAnimation(); // Run the success animation
      
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
      }, 500);
    } catch (err) {
      console.error('Error setting username:', err);
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 3 + 1;
      particles.push(
        <View 
          key={i}
          style={[
            styles.particle,
            {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: size,
              height: size,
              opacity: Math.random() * 0.5 + 0.1,
            }
          ]}
        />
      );
    }
    
    return particles;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={['#0D0B20', '#16142A']}
            style={styles.gradientBackground}
          />
          
          {/* Particles */}
          {renderParticles()}
          
          {/* Glow effects */}
          <View style={[styles.glowEffect, { top: '10%', left: '20%' }]} />
          <View style={[styles.glowEffect, { bottom: '15%', right: '10%', width: 220, height: 220 }]} />
          
          <Animated.View 
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(40, 38, 80, 0.8)', 'rgba(28, 27, 51, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardAccent} />
              <View style={styles.cardContent}>
                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <LinearGradient
                      colors={['#7B4DFF', '#9E6CFF']}
                      style={styles.logoBackground}
                    >
                      <Ionicons name="game-controller" size={45} color="#FFFFFF" style={styles.logoIconSecondary} />
                      <LinearGradient
                        colors={['#FF4C8B', '#FF7950']}
                        style={styles.logoIconPrimaryContainer}
                      >
                        <Ionicons name="shield" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </LinearGradient>
                  </View>
                  <Text style={styles.headerTitle}>Create Your Gamer Tag</Text>
                  <Text style={styles.subtitle}>
                    Choose a unique username for your journey
                  </Text>
                </View>
                
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                {submitted ? (
                  <Animated.View 
                    style={[
                      styles.successContainer,
                      {
                        opacity: successAnim,
                        transform: [{ 
                          scale: successAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={['#2ebb77', '#34D484']}
                      style={styles.successIcon}
                    >
                      <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.successTitle}>Username Set Successfully!</Text>
                    <Text style={styles.successText}>Preparing your dashboard...</Text>
                    <View style={styles.progressContainer}>
                      <Animated.View 
                        style={[
                          styles.progressFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%']
                            })
                          }
                        ]}
                      >
                        <LinearGradient
                          colors={['#7B4DFF', '#9E6CFF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ height: '100%', width: '100%' }}
                        />
                      </Animated.View>
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <View style={styles.labelContainer}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.labelBadge}>
                          <Text style={styles.labelBadgeText}>Required</Text>
                        </View>
                      </View>
                      
                      <Animated.View 
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: inputFocusAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['#2a2c3d', '#7B4DFF']
                            }),
                            shadowOpacity: inputFocusAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.1, 0.3]
                            })
                          }
                        ]}
                      >
                        <Ionicons name="person" size={20} color="#A0A0CC" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Create a username"
                          placeholderTextColor="#787994"
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="none"
                          returnKeyType="done"
                          editable={!loading}
                          autoFocus
                          onFocus={() => {
                            Animated.timing(inputFocusAnim, {
                              toValue: 1,
                              duration: 200,
                              useNativeDriver: false,
                            }).start();
                          }}
                          onBlur={() => {
                            Animated.timing(inputFocusAnim, {
                              toValue: 0,
                              duration: 200,
                              useNativeDriver: false,
                            }).start();
                          }}
                        />
                        {username && !validateUsername(username) && (
                          <Ionicons name="checkmark-circle" size={20} color="#2ebb77" style={styles.validIcon} />
                        )}
                      </Animated.View>
                      
                      <View style={styles.inputHint}>
                        <Ionicons name="information-circle" size={16} color="#787994" />
                        <Text style={styles.hintText}>
                          3-30 characters, letters, numbers, dots, underscores, dashes
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.submitButton, loading && styles.disabledButton]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#7B4DFF', '#9E6CFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
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
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <View style={styles.noteContainer}>
                      <Ionicons name="information-circle" size={18} color="#787994" />
                      <Text style={styles.noteText}>
                        You can change your username later from your profile settings
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B20',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#7B4DFF',
  },
  glowEffect: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(123, 77, 255, 0.08)',
    shadowColor: '#7B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    zIndex: 1,
    backgroundImage: 'linear-gradient(to right, #7B4DFF, #9E6CFF, #FF4C8B)',
    backgroundColor: '#7B4DFF',
  },
  cardContent: {
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    marginBottom: 25,
    position: 'relative',
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B4DFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  logoIconSecondary: {
    fontSize: 50,
  },
  logoIconPrimaryContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16142A',
    shadowColor: '#FF4C8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  headerTitle: {
    marginLeft: 25,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(123, 77, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
    fontFamily: 'Orbitron-Bold',
  },
  subtitle: {
    color: '#A0A0CC',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4C8B',
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 12,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  labelBadge: {
    backgroundImage: 'linear-gradient(to right, #7B4DFF, #9E6CFF)',
    backgroundColor: '#7B4DFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  labelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 20, 42, 0.6)',
    borderRadius: 12,
    height: 60,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    shadowColor: '#7B4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginHorizontal: 15,
    fontSize: 20,
  },
  input: {
    flex: 1,
    height: 60,
    color: '#FFFFFF',
    fontSize: 16,
  },
  validIcon: {
    marginRight: 15,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 5,
  },
  hintText: {
    color: '#787994',
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 18,
  },
  submitButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(123, 77, 255, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
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
    fontFamily: 'Orbitron-Bold',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  noteText: {
    color: '#A0A0CC',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: 'rgba(46, 187, 119, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Orbitron-Bold',
  },
  successText: {
    fontSize: 16,
    color: '#A0A0CC',
    marginBottom: 25,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '0%',
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default CreateUsernameScreen;
