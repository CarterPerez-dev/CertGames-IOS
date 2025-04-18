// src/screens/auth/LoginScreen.js
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
import { loginUser, clearAuthErrors, fetchUserData } from '../../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API } from '../../api/apiConfig';
import { useNavigation } from '@react-navigation/native';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';
import GoogleAuthService from '../../api/GoogleAuthService';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading, error } = useSelector((state) => state.user);
  
  // URL for OAuth redirect
  const redirectUrl = 'com.googleusercontent.apps.64761236473-3as2ugjri0ql0snujt83fei049dvvr4g:/oauth2redirect';

  useEffect(() => {
    // Clear any auth errors when component mounts
    dispatch(clearAuthErrors());
    
    // Check for biometric availability
    checkBiometricAvailability();
    
    // Check for saved credentials
    checkForSavedCredentials();
    
    // Check for Apple Authentication availability
    checkAppleAuthAvailability();
    
    // Set up deep linking handler for OAuth redirects
    console.log("[DEEP-LINK-DEBUG] Setting up deep link handler in LoginScreen");
    
    // Test if the handler is working
    Linking.getInitialURL().then(url => {
      console.log("[DEEP-LINK-DEBUG] Initial URL in LoginScreen:", url);
    });
    
    const subscription = Linking.addEventListener('url', handleRedirect);
    
    return () => {
      console.log("[DEEP-LINK-DEBUG] Removing deep link handler in LoginScreen");
      subscription.remove();
    };
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricAvailable(available && isEnrolled);
  };
  
  const checkAppleAuthAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setAppleAuthAvailable(available);
  };
  
  const checkForSavedCredentials = async () => {
    try {
      const credentials = await SecureStore.getItemAsync('userCredentials');
      if (credentials) {
        const parsed = JSON.parse(credentials);
        setSavedCredentials(parsed);
      }
    } catch (error) {
      console.error('Error retrieving saved credentials:', error);
    }
  };
  
  const handleBiometricAuth = async () => {
    if (!savedCredentials) {
      Alert.alert('No Saved Credentials', 'Please log in with your username and password first or social login.');
      return;
    }
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Use password'
      });
      
      if (result.success) {
        // If biometric auth succeeded, use saved credentials to log in
        dispatch(loginUser({
          usernameOrEmail: savedCredentials.usernameOrEmail,
          password: savedCredentials.password
        }));
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Authentication Failed', 'Please try again or use your password or social login.');
    }
  };

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      Alert.alert('Missing Information', 'Please enter both username and password');
      return;
    }
    
    try {
      const resultAction = await dispatch(loginUser({ usernameOrEmail, password }));
      
      if (loginUser.rejected.match(resultAction)) {
        // This is an expected error, no need to do anything as it's already in the Redux state
        return;
      }
      
      // If login successful, save credentials for biometric login
      await SecureStore.setItemAsync('userCredentials', JSON.stringify({
        usernameOrEmail,
        password
      }));
      
      // Check subscription status from Apple if on iOS
      if (Platform.OS === 'ios') {
        try {
          // Initialize IAP connection
          await AppleSubscriptionService.initializeConnection();
          
          // Check local receipts and verify with backend
          const subscriptionStatus = await AppleSubscriptionService.checkSubscriptionStatus(
            resultAction.payload.user_id
          );
          
          // If subscription status differs from backend, sync it
          if (subscriptionStatus.subscriptionActive !== resultAction.payload.subscriptionActive) {
            console.log('Syncing subscription status with backend...');
            // This will update the backend status based on local receipt
            await AppleSubscriptionService.restorePurchases(resultAction.payload.user_id);
          }
        } catch (err) {
          console.log('Error checking subscription status:', err);
          // Non-fatal error, continue with login
        }
      }
      
      // Navigation is handled by the app navigator once user is set in Redux
    } catch (err) {
      // This should not happen anymore since we're handling errors above
      console.log('Unexpected error during login:', err);
    }
  };
  

    const handleGoogleLogin = async () => {
      try {
        // Call the sign in method from your service
        const result = await GoogleAuthService.signIn();
        console.log("[DEBUG] Google sign in result:", result);
        
        if (!result.success) {
          throw new Error(result.error || 'Sign in failed');
        }
        
        // STEP 1: Store user ID
        await SecureStore.setItemAsync('userId', result.userId);
        
        // STEP 2: Update Redux state
        dispatch({ type: 'user/setCurrentUserId', payload: result.userId });
        
        // Handle special cases
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
          // STEP 3: For users with active subscriptions,
          // let AppNavigator handle the navigation
          
          // Update Redux with complete user data
          await dispatch(fetchUserData(result.userId));
          

          // AppNavigator will automatically switch to MainNavigator
        }
      } catch (error) {
        console.error('[DEBUG] Google login error:', error);
      }
    };
  
    const handleAppleLogin = async () => {
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
                // STEP 3: For users with active subscriptions, 
                // simply do nothing and let AppNavigator handle it
                
                // Update Redux with complete user data
                await dispatch(fetchUserData(data.userId));
                

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
    
    
    const handleRedirect = async (event) => {
      try {
        // Extract userId and other params from the URL
        const { url } = event;
        console.log("[DEEP-LINK-DEBUG] Received deep link:", url);
        
        const params = Linking.parse(url).queryParams;
        
        // Verify state parameter to prevent CSRF
        // ... [existing CSRF check code] ...
        
        if (params.userId) {
          // STEP 1: Store user ID
          await SecureStore.setItemAsync('userId', params.userId);
          
          // STEP 2: Update Redux state
          dispatch({ type: 'user/setCurrentUserId', payload: params.userId });
          
          // Special cases handling
          if (params.needsUsername === 'true') {
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'CreateUsername',
                params: { userId: params.userId, provider: params.provider || 'oauth' }
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
            // STEP 3: For existing users with subscriptions, let AppNavigator handle it
            await dispatch(fetchUserData(params.userId));
            
            // Show feedback while AppNavigator switches
            Alert.alert(
              "Login Successful", 
              "You're now being redirected to the app...",
              [{ text: "OK", style: "default" }]
            );
          }
        }
      } catch (error) {
        console.error("[DEEP-LINK-DEBUG] Error handling deep link:", error);
      }
    };
    
    
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const navigateToPrivacyPolicy = () => {
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
                  <Ionicons name="shield-half-outline" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.headerTitle}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>
              </View>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your Username"
                      placeholderTextColor="#AAAAAA"
                      value={usernameOrEmail}
                      onChangeText={setUsernameOrEmail}
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                </View>
                
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#AAAAAA"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      returnKeyType="done"
                      editable={!loading}
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
                </View>
                
                <View style={styles.optionsContainer}>
                  <View style={{flex: 1}} />
                  <TouchableOpacity onPress={navigateToForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={handleLogin}
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
                        <Text style={styles.buttonText}>Signing In...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                {isBiometricAvailable && savedCredentials && (
                  <TouchableOpacity 
                    style={styles.biometricButton}
                    onPress={handleBiometricAuth}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(101, 67, 204, 0.1)', 'rgba(138, 88, 252, 0.1)']}
                      style={styles.biometricGradient}
                    >
                      <Ionicons 
                        name={Platform.OS === 'ios' ? "scan-outline" : "finger-print-outline"} 
                        size={24} 
                        color="#6543CC" 
                      />
                      <Text style={styles.biometricText}>
                        Sign in with {Platform.OS === 'ios' ? 'Face ID' : 'Touch ID'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.divider} />
              </View>
              
              <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
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
                    onPress={handleAppleLogin}
                    disabled={loading}
                  >
                    <Ionicons name="logo-apple" size={20} color="#000000" />
                    <Text style={styles.socialButtonAppleText}>Apple</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.privacyContainer}
                onPress={navigateToPrivacyPolicy}
              >
                <Text style={styles.privacyText}>Privacy Policy</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
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
    borderWidth: 0.5,
    borderColor: 'rgba(101, 67, 204, 0.1)',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    width: '100%',
    height: '100%',
    borderRightWidth: 40,
    borderBottomWidth: 40,
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(101, 67, 204, 0.15)',
    top: '30%',
    alignSelf: 'center',
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6543CC',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
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
  biometricButton: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.3)',
  },
  biometricGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  biometricText: {
    color: '#6543CC',
    fontSize: 15,
    fontWeight: '500',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    color: '#AAAAAA',
  },
  registerLink: {
    color: '#6543CC',
    fontWeight: 'bold',
  },
  privacyContainer: {
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  privacyText: {
    color: '#AAAAAA',
    fontSize: 13,
  },
});

export default LoginScreen;
