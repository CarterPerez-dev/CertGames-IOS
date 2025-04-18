// src/screens/auth/RegisterScreen.js
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
  SafeAreaView,
  Animated,
  Easing
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// Added fetchUserData to imports to match LoginScreen behavior
import { registerUser, clearAuthErrors, fetchUserData } from '../../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { API } from '../../api/apiConfig';
import { useNavigation } from '@react-navigation/native';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';
import GoogleAuthService from '../../api/GoogleAuthService';

WebBrowser.maybeCompleteAuthSession();

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  
  // Animation states
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const requirementsHeight = useState(new Animated.Value(0))[0];
  const requirementsOpacity = useState(new Animated.Value(0))[0];
  
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinimumLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  const { loading, error } = useSelector((state) => state.user);
  
  // URL for OAuth redirect
  const redirectUrl = 'com.googleusercontent.apps.64761236473-3as2ugjri0ql0snujt83fei049dvvr4g:/oauth2redirect';

  // Clear errors when component mounts or unmounts
  useEffect(() => {
    dispatch(clearAuthErrors());
    checkAppleAuthAvailability();
    
    // Set up deep linking handler for OAuth redirects
    console.log("[DEEP-LINK-DEBUG] Setting up deep link handler in RegisterScreen");
    
    // Test if the handler is working
    Linking.getInitialURL().then(url => {
      console.log("[DEEP-LINK-DEBUG] Initial URL in RegisterScreen:", url);
    });
    
    const subscription = Linking.addEventListener('url', handleRedirect);
    
    return () => {
      console.log("[DEEP-LINK-DEBUG] Removing deep link handler in RegisterScreen");
      subscription.remove();
      dispatch(clearAuthErrors());
    };
  }, [dispatch]);
  
  // Check Apple Authentication availability
  const checkAppleAuthAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setAppleAuthAvailable(available);
  };
  
  // Update password validation whenever password changes
  useEffect(() => {
    setPasswordValidation({
      hasMinimumLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()\-_=+\[\]{}|;:'",<.>/?`~\\]/.test(password)
    });
  }, [password]);

  // Enhanced animation for password requirements
  useEffect(() => {
    if (showPasswordRequirements) {
      Animated.parallel([
        Animated.timing(requirementsHeight, {
          toValue: 1,
          duration: 250, // Slightly faster
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // More natural easing
          useNativeDriver: false
        }),
        Animated.timing(requirementsOpacity, {
          toValue: 1,
          duration: 200, // Opacity animates slightly faster than height
          useNativeDriver: false
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(requirementsHeight, {
          toValue: 0,
          duration: 180, // Faster closing animation
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false
        }),
        Animated.timing(requirementsOpacity, {
          toValue: 0,
          duration: 150, // Faster fade out
          useNativeDriver: false
        })
      ]).start();
    }
  }, [showPasswordRequirements]);

  const passwordIsValid = () => {
    return Object.values(passwordValidation).every(val => val === true);
  };
  
  const validateForm = () => {
    // Check if all fields are filled
    if (!username || !password || !confirmPassword) {
      setFormError('All fields are required');
      return false;
    }
    
    // Check if password meets requirements
    if (!passwordIsValid()) {
      setFormError('Password does not meet all requirements');
      setShowPasswordRequirements(true);
      return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    // Check if terms are agreed to
    if (!agreeTerms) {
      setFormError('You must agree to the Terms and Conditions');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    // For React Native, we use the navigation object directly
    // Generate email from username to maintain backend compatibility
    const registrationData = {
      username,
      email: `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@certgames.app`,
      password,
      confirmPassword: confirmPassword
    };
    
    // Navigate to subscription screen with registration data
    navigation.navigate('SubscriptionIOS', { 
      registrationData, 
      isOauthFlow: false,
      isNewUsername: false
    });
  };
  
  // UPDATED: Modified to match LoginScreen's handleGoogleLogin behavior
  const handleGoogleSignUp = async () => {
    try {
      // Call the sign in method from our service
      const result = await GoogleAuthService.signIn();
      console.log("[DEBUG] Google sign up result:", result);
      
      if (!result.success) {
        throw new Error(result.error || 'Sign up failed');
      }
      
      // STEP 1: Store user ID
      await SecureStore.setItemAsync('userId', result.userId);
      
      // STEP 2: Update Redux state
      dispatch({ type: 'user/setCurrentUserId', payload: result.userId });
      
      // Handle navigation based on result
      if (result.needsUsername) {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'CreateUsername', 
            params: { userId: result.userId, provider: 'google' }
          }]
        });
      } else if (!result.hasSubscription) {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'SubscriptionIOS', 
            params: { userId: result.userId }
          }]
        });
      } else {
        // CHANGED: For users with active subscriptions, let AppNavigator handle the navigation
        // instead of directly resetting to Home
        
        // Update Redux with complete user data
        await dispatch(fetchUserData(result.userId));
        
        // AppNavigator will automatically switch to MainNavigator
      }
    } catch (error) {
      console.error('[DEBUG] Google sign up error:', error);

    }
  };
  
  // UPDATED: Modified to match LoginScreen's handleAppleLogin behavior
  const handleAppleSignUp = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log("[DEBUG] Apple credential received:", credential.identityToken ? "Token received" : "No token");
      
      // Send the credential to your backend - FIXED: use the mobile endpoint
      const response = await fetch(API.AUTH.OAUTH_APPLE_MOBILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
          email: credential.email,
          platform: 'ios'
        }),
      });
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        
        if (response.ok) {
          // STEP 1: Update SecureStore with userId
          await SecureStore.setItemAsync('userId', data.userId);
          
          // STEP 2: Update Redux state with the userId
          dispatch({ type: 'user/setCurrentUserId', payload: data.userId });
          
          // Special case: If user needs username, still navigate directly to that screen
          if (data.needsUsername) {
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'CreateUsername', 
                params: { userId: data.userId, provider: 'apple' }
              }]
            });
          } else {
            // Check subscription status
            const subscriptionStatus = await AppleSubscriptionService.checkSubscriptionStatus(data.userId);
            
            // Special case: If no subscription, navigate to subscription screen
            if (!subscriptionStatus.subscriptionActive) {
              navigation.reset({
                index: 0,
                routes: [{ 
                  name: 'SubscriptionIOS',
                  params: { userId: data.userId }
                }]
              });
            } else {
              // CHANGED: For users with active subscriptions, let AppNavigator handle it
              // instead of directly navigating to Home
              
              // Update Redux with complete user data
              await dispatch(fetchUserData(data.userId));
              
              // AppNavigator will automatically switch to MainNavigator
            }
          }
        } else {
          throw new Error(data.error || 'Apple sign-in failed');
        }
      } else {
        // Handle non-JSON response with more detailed logging
        const text = await response.text();
        console.error("[DEBUG] Non-JSON response status:", response.status);
        console.error("[DEBUG] Response headers:", JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
        console.error("[DEBUG] Non-JSON response text:", text.substring(0, 300) + "...");
        throw new Error(`Server returned non-JSON response with status ${response.status}`);
      }
    } catch (error) {
      console.error('[DEBUG] Apple login error:', error);
    }
  };
  
  // UPDATED: Modified to match LoginScreen's handleRedirect behavior
  const handleRedirect = async (event) => {
    try {
      // Extract userId and other params from the URL
      const { url } = event;
      console.log("[DEEP-LINK-DEBUG] Received deep link in RegisterScreen:", url);
      
      const params = Linking.parse(url).queryParams;
      console.log("[DEEP-LINK-DEBUG] Parsed params in RegisterScreen:", JSON.stringify(params));
      console.log("[DEEP-LINK-DEBUG] userId present:", params.userId ? "YES" : "NO");
      
      // Verify state parameter to prevent CSRF
      const storedState = await SecureStore.getItemAsync('oauth_state');
      if (params.state && storedState && params.state !== storedState) {
        console.error("[DEEP-LINK-DEBUG] State mismatch, possible CSRF attack");
        Alert.alert('Security Error', 'Authentication failed due to invalid state parameter.');
        return;
      }
      
      // Clear the state after use
      await SecureStore.deleteItemAsync('oauth_state');
      
      if (params.userId) {
        // STEP 1: Store user ID
        await SecureStore.setItemAsync('userId', params.userId);
        
        // STEP 2: Update Redux state
        dispatch({ type: 'user/setCurrentUserId', payload: params.userId });
        
        // Navigate using reset to ensure the navigation state is completely replaced
        if (params.needsUsername === 'true') {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'CreateUsername',
              params: { userId: params.userId, provider: params.provider || 'google' }
            }]
          });
        } else if (params.isNewUser === 'true' || params.hasSubscription === 'false') {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'SubscriptionIOS',
              params: { userId: params.userId }
            }]
          });
        } else {
          // CHANGED: For existing users with subscriptions, let AppNavigator handle it
          // instead of directly navigating to Home
          await dispatch(fetchUserData(params.userId));
          
          // ADDED: Show feedback while AppNavigator switches (matching LoginScreen)
          Alert.alert(
            "Login Successful", 
            "You're now being redirected to the app...",
            [{ text: "OK", style: "default" }]
          );
        }
      } else if (params.error) {
        console.error("[DEEP-LINK-DEBUG] OAuth error:", params.error);
      }
    } catch (error) {
      console.error("[DEEP-LINK-DEBUG] Error handling deep link:", error);
      console.error("[DEEP-LINK-DEBUG] Error stack:", error.stack);
    }
  };

  const openTermsAndConditions = () => {
    navigation.navigate('Terms');
  };

  const openPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Background elements */}
          <LinearGradient
            colors={['#0b0c15', '#121225']}
            style={styles.gradientBackground}
          >
            <View style={styles.gridOverlay} />
          </LinearGradient>
          
          <View style={styles.glowEffect} />
          
          {/* Floating particles */}
          {[...Array(5)].map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.particle, 
                { 
                  top: `${10 + index * 20}%`, 
                  left: `${index * 25}%`,
                  width: 2 + index % 3,
                  height: 2 + index % 3
                }
              ]} 
            />
          ))}
          
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['rgba(30, 30, 50, 0.8)', 'rgba(23, 26, 35, 0.95)']}
              style={styles.card}
            >
              <View style={styles.cardAccent} />
              
              <View style={styles.header}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  style={styles.logoContainer}
                >
                  <Ionicons name="person-add" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.headerTitle}>Create Account</Text>
                <Text style={styles.subtitle}>Join and start your certification journey</Text>
              </View>
              
              {(formError || error) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                  <Text style={styles.errorText}>{formError || error}</Text>
                </View>
              )}
              
              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Unique Username"
                      placeholderTextColor="#AAAAAA"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                  
                  <View style={styles.inputHint}>
                    <Ionicons name="information-circle-outline" size={16} color="#00cc00" />
                    <Text style={styles.hintText}>3-30 characters, letters, numbers, dots, underscores, dashes</Text>
                  </View>
                </View>
                
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#AAAAAA"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!loading}
                      onFocus={() => setShowPasswordRequirements(true)}
                      onBlur={() => {
                        // Keep requirements visible if there's text or error
                        if (!password) {
                          setShowPasswordRequirements(false);
                        }
                      }}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#AAAAAA" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Animated.View 
                    style={[
                      styles.requirementsContainer,
                      {
                        opacity: requirementsOpacity,
                        maxHeight: requirementsHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 180]
                        }),
                        overflow: 'hidden',
                        transform: [{ 
                          translateY: requirementsHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={styles.requirementsHeader}>
                      <Text style={styles.requirementsTitle}>Requirements</Text>
                      {passwordIsValid() ? (
                        <View style={styles.validBadge}>
                          <Ionicons name="checkmark" size={12} color="#2ebb77" />
                          <Text style={styles.validText}>Valid</Text>
                        </View>
                      ) : (
                        <View style={styles.invalidBadge}>
                          <Ionicons name="close" size={12} color="#ff4e4e" />
                          <Text style={styles.invalidText}>Invalid</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.requirementsList}>
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={passwordValidation.hasMinimumLength ? "checkmark-circle" : "close-circle"} 
                          size={14}
                          color={passwordValidation.hasMinimumLength ? "#2ebb77" : "#ff4e4e"} 
                        />
                        <Text 
                          style={[
                            styles.requirementText,
                            passwordValidation.hasMinimumLength ? styles.validRequirement : styles.invalidRequirement
                          ]}
                        >
                          6-69 characters
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={passwordValidation.hasUpperCase ? "checkmark-circle" : "close-circle"} 
                          size={14}
                          color={passwordValidation.hasUpperCase ? "#2ebb77" : "#ff4e4e"} 
                        />
                        <Text 
                          style={[
                            styles.requirementText,
                            passwordValidation.hasUpperCase ? styles.validRequirement : styles.invalidRequirement
                          ]}
                        >
                          Uppercase letter
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={passwordValidation.hasLowerCase ? "checkmark-circle" : "close-circle"} 
                          size={14}
                          color={passwordValidation.hasLowerCase ? "#2ebb77" : "#ff4e4e"} 
                        />
                        <Text 
                          style={[
                            styles.requirementText,
                            passwordValidation.hasLowerCase ? styles.validRequirement : styles.invalidRequirement
                          ]}
                        >
                          Lowercase letter
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={passwordValidation.hasNumber ? "checkmark-circle" : "close-circle"} 
                          size={14}
                          color={passwordValidation.hasNumber ? "#2ebb77" : "#ff4e4e"} 
                        />
                        <Text 
                          style={[
                            styles.requirementText,
                            passwordValidation.hasNumber ? styles.validRequirement : styles.invalidRequirement
                          ]}
                        >
                          Number
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={passwordValidation.hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                          size={14}
                          color={passwordValidation.hasSpecialChar ? "#2ebb77" : "#ff4e4e"} 
                        />
                        <Text 
                          style={[
                            styles.requirementText,
                            passwordValidation.hasSpecialChar ? styles.validRequirement : styles.invalidRequirement
                          ]}
                        >
                          Special character
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
                
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#AAAAAA"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      returnKeyType="done"
                      editable={!loading}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#AAAAAA" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {password && confirmPassword && (
                    <View style={[
                      styles.passwordMatch,
                      password === confirmPassword ? styles.matchSuccess : styles.matchError
                    ]}>
                      <Ionicons 
                        name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={password === confirmPassword ? "#2ebb77" : "#ff4e4e"} 
                      />
                      <Text style={[
                        styles.matchText,
                        password === confirmPassword ? styles.matchSuccessText : styles.matchErrorText
                      ]}>
                        {password === confirmPassword ? "Passwords match" : "Passwords don't match"}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.termsContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox} 
                    onPress={() => setAgreeTerms(!agreeTerms)}
                  >
                    {agreeTerms ? (
                      <LinearGradient
                        colors={['#6543CC', '#8A58FC']}
                        style={styles.checkedBox}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    ) : (
                      <View style={styles.uncheckedBox} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>
                      I agree to the {' '}
                      <Text style={styles.termsLink} onPress={openTermsAndConditions}>
                        Terms and Conditions
                      </Text>
                      {' '}and{' '}
                      <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6543CC', '#8A58FC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#FFFFFF" />
                        <Text style={styles.buttonText}>Creating Account...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.divider} />
              </View>
              
              <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignUp}
                disabled={loading}
              >
                {/* We'll replace this Ionicon in the next step */}
                <Ionicons name="logo-google" size={20} color="#EA4335" /> 
                
                {/* Container for the multi-colored text */}
                <View style={styles.googleTextContainer}> 
                  <Text style={[styles.googleLetterBase, { color: '#4285F4' }]}>G</Text>
                  <Text style={[styles.googleLetterBase, { color: '#EA4335' }]}>o</Text>
                  <Text style={[styles.googleLetterBase, { color: '#FBBC05' }]}>o</Text>
                  <Text style={[styles.googleLetterBase, { color: '#4285F4' }]}>g</Text>
                  <Text style={[styles.googleLetterBase, { color: '#34A853' }]}>l</Text>
                  <Text style={[styles.googleLetterBase, { color: '#EA4335' }]}>e</Text>
                </View>
              </TouchableOpacity>
                
                {appleAuthAvailable && (
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={handleAppleSignUp}
                    disabled={loading}
                  >
                    <Ionicons name="logo-apple" size={20} color="#000000" />
                    <Text style={styles.socialButtonAppleText}>Apple</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.2,
    // Grid pattern using borderWidth and setting left & top values
    // This creates a subtle grid effect without images
    borderWidth: 0.5,
    borderColor: 'rgba(101, 67, 204, 0.1)',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    width: '100%',
    height: '100%',
    // Setting these values creates the grid
    borderRightWidth: 40,
    borderBottomWidth: 40,
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(101, 67, 204, 0.15)',
    top: '10%',
    alignSelf: 'center',
    // Add a radial blur
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 20,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6543CC',
    opacity: 0.6,
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#8A58FC',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    // Add a shadow for the logo
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    // Add a text shadow
    textShadowColor: 'rgba(101, 67, 204, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4C8B',
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputWrap: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 5,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    paddingRight: 15,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 12,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginLeft: 5,
  },
  requirementsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  requirementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  invalidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  validText: {
    color: '#2ebb77',
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '500',
  },
  invalidText: {
    color: '#ff4e4e',
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '500',
  },
  requirementsList: {
    marginTop: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 6,
  },
  validRequirement: {
    color: '#2ebb77',
  },
  invalidRequirement: {
    color: '#AAAAAA',
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  matchSuccess: {
    color: '#2ebb77',
  },
  matchError: {
    color: '#ff4e4e',
  },
  matchText: {
    marginLeft: 8,
    fontSize: 13,
  },
  matchSuccessText: {
    color: '#2ebb77',
  },
  matchErrorText: {
    color: '#ff4e4e',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  checkedBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#AAAAAA',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#6543CC',
    fontWeight: '500',
  },
  registerButton: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    // Add a shadow
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#AAAAAA',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  googleTextContainer: {
    flexDirection: 'row', // Arrange letters horizontally
  },
  // Base style for each letter (inherits boldness, etc.)
  googleLetterBase: {
    fontWeight: 'bold',
    fontSize: 14, // Match your desired text size
  },
  socialButtonAppleText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  loginText: {
    color: '#AAAAAA',
  },
  loginLink: {
    color: '#6543CC',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
