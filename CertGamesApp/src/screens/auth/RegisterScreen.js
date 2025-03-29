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
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthErrors } from '../../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { API } from '../../api/apiConfig';
import { useNavigation } from '@react-navigation/native';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';

WebBrowser.maybeCompleteAuthSession();

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
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
  const redirectUri = Linking.createURL('/oauth-callback');

  // Clear errors when component mounts or unmounts
  useEffect(() => {
    dispatch(clearAuthErrors());
    checkAppleAuthAvailability();
    
    // Set up deep linking handler for OAuth redirects
    const subscription = Linking.addEventListener('url', handleRedirect);
    
    return () => {
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
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()\-_=+[\]{}|;:'",<.>/?`~\\]/.test(password)
    });
  }, [password]);

  const passwordIsValid = () => {
    return Object.values(passwordValidation).every(val => val === true);
  };
  
  const validateForm = () => {
    // Check if all fields are filled
    if (!username || !email || !password || !confirmPassword) {
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
    // Instead of registering immediately, navigate to subscription page with form data
    const registrationData = {
      username,
      email,
      password,
      confirmPassword: confirmPassword
    };
    
    // Navigate to subscription screen with registration data
    navigation.navigate('SubscriptionIOS', { 
      registrationData, 
      isOauthFlow: false 
    });
  };
  
  const handleGoogleSignUp = async () => {
    try {
      // Create a random state parameter for security
      const randomState = Math.random().toString(36).substring(2, 15);
      await SecureStore.setItemAsync('oauth_state', randomState);
      
      // Create properly formatted redirect URL for mobile
      const redirectUrl = Linking.createURL('oauth-callback');
      console.log('[DEBUG] Redirect URL:', redirectUrl);
      
      // Launch web browser with state parameter and mobile-specific endpoint
      const authUrl = `${API.AUTH.OAUTH_GOOGLE_MOBILE}?redirect_uri=${encodeURIComponent(redirectUrl)}&state=${randomState}&platform=ios&client_id=64761236473-3as2ugjri0ql0snujt83fei049dvvr4g.apps.googleusercontent.com`;
      
      console.log("[DEBUG] Opening auth URL:", authUrl);
      
      // Use Expo's authentication session
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          showInRecents: true,
          preferEphemeralSession: false // Try this setting for better auth flow
        }
      );
      
      console.log("[DEBUG] Auth result type:", result.type);
      console.log("[DEBUG] Auth result:", JSON.stringify(result, null, 2));
      
      if (result.type === 'success') {
        // The URL parameters will be handled by the Linking event handler
        console.log("[DEBUG] Login successful, waiting for deep link handler");
      } else if (result.type === 'cancel') {
        console.log("[DEBUG] User cancelled login");
      }
    } catch (error) {
      console.error('[DEBUG] Google login error:', error);
      Alert.alert('Sign Up Failed', 'Google sign-in could not be completed.');
    }
  };
  
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
          // Handle success, user ID would be in data.userId
          await SecureStore.setItemAsync('userId', data.userId);
          dispatch({ type: 'user/setCurrentUserId', payload: data.userId });
          
          // If the user needs to set a username (new user), navigate to that screen
          if (data.needsUsername) {
            navigation.navigate('CreateUsername', { 
              userId: data.userId, 
              provider: 'apple' 
            });
          } else {
            // Check subscription status and navigate accordingly
            const subscriptionStatus = await AppleSubscriptionService.checkSubscriptionStatus(data.userId);
            if (subscriptionStatus.subscriptionActive) {
              navigation.navigate('Home');
            } else {
              navigation.navigate('SubscriptionIOS');
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
      Alert.alert('Sign Up Failed', error.message || 'Apple sign-in could not be completed.');
    }
  };
  
  const handleRedirect = async (event) => {
    try {
      // Extract userId and other params from the URL
      const { url } = event;
      console.log("Received deep link:", url);
      
      const params = Linking.parse(url).queryParams;
      console.log("Parsed params:", params);
      
      // Verify state parameter to prevent CSRF
      const storedState = await SecureStore.getItemAsync('oauth_state');
      if (params.state && storedState && params.state !== storedState) {
        console.error("State mismatch, possible CSRF attack");
        Alert.alert('Security Error', 'Authentication failed due to invalid state parameter.');
        return;
      }
      
      // Clear the state after use
      await SecureStore.deleteItemAsync('oauth_state');
      
      if (params.userId) {
        // Store user ID and set in Redux
        await SecureStore.setItemAsync('userId', params.userId);
        dispatch({ type: 'user/setCurrentUserId', payload: params.userId });
        
        // If the user needs to set a username, navigate to that screen
        if (params.needsUsername === 'true') {
          navigation.navigate('CreateUsername', { 
            userId: params.userId, 
            provider: params.provider || 'google'
          });
        } else {
          // Check subscription status and navigate accordingly
          try {
            // For new users without subscription, go to subscription page
            if (params.isNewUser === 'true' || params.hasSubscription === 'false') {
              navigation.navigate('SubscriptionIOS', {
                userId: params.userId
              });
            } else {
              // User already has subscription or has been registered previously
              navigation.navigate('Home');
            }
          } catch (err) {
            console.error("Error checking subscription:", err);
            // Default to subscription screen if there's an error
            navigation.navigate('SubscriptionIOS', {
              userId: params.userId
            });
          }
        }
      } else if (params.error) {
        console.error("OAuth error:", params.error);
        Alert.alert('Login Failed', params.error_description || params.error);
      }
    } catch (error) {
      console.error("Deep link handling error:", error);
    }
  };

  const openTermsAndConditions = () => {
    navigation.navigate('Terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={['#121212', '#1a1a2e']}
            style={styles.gradientBackground}
          />
          
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a unique username"
                placeholderTextColor="#AAAAAA"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputHint}>
              <Ionicons name="information-circle-outline" size={16} color="#AAAAAA" />
              <Text style={styles.hintText}>3-30 characters, letters, numbers, dots, underscores, dashes</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
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
            
            {showPasswordRequirements && (
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementsHeader}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  {passwordIsValid() ? (
                    <View style={styles.validStatus}>
                      <Ionicons name="checkmark" size={14} color="#2ebb77" />
                      <Text style={styles.validText}>Valid</Text>
                    </View>
                  ) : (
                    <View style={styles.invalidStatus}>
                      <Ionicons name="close" size={14} color="#ff4e4e" />
                      <Text style={styles.invalidText}>Invalid</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordValidation.hasMinimumLength ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordValidation.hasMinimumLength ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasMinimumLength ? styles.validRequirement : styles.invalidRequirement
                    ]}>
                      At least 6 characters long
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordValidation.hasUpperCase ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordValidation.hasUpperCase ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasUpperCase ? styles.validRequirement : styles.invalidRequirement
                    ]}>
                      At least one uppercase letter
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordValidation.hasLowerCase ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordValidation.hasLowerCase ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasLowerCase ? styles.validRequirement : styles.invalidRequirement
                    ]}>
                      At least one lowercase letter
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordValidation.hasNumber ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordValidation.hasNumber ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasNumber ? styles.validRequirement : styles.invalidRequirement
                    ]}>
                      At least one number
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordValidation.hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordValidation.hasSpecialChar ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasSpecialChar ? styles.validRequirement : styles.invalidRequirement
                    ]}>
                      At least one special character
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
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
            
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkbox} 
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                {agreeTerms ? (
                  <Ionicons name="checkbox" size={24} color="#6543CC" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#AAAAAA" />
                )}
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the {' '}
                  <Text style={styles.termsLink} onPress={openTermsAndConditions}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
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
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            {appleAuthAvailable && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleAppleSignUp}
                disabled={loading}
              >
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 10,
    height: 50,
  },
  inputIcon: {
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    paddingRight: 15,
  },
  passwordToggle: {
    padding: 15,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingLeft: 5,
  },
  hintText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginLeft: 5,
  },
  requirementsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  requirementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  validStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  invalidStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  validText: {
    color: '#2ebb77',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  invalidText: {
    color: '#ff4e4e',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  requirementsList: {
    marginTop: 5,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
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
    marginBottom: 15,
    paddingLeft: 5,
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
  },
  checkbox: {
    marginRight: 10,
    marginTop: -2,
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
    backgroundColor: '#6543CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#4F4F4F',
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
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
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
    backgroundColor: '#2A2A2A',
    height: 50,
    borderRadius: 8,
    gap: 10,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
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
