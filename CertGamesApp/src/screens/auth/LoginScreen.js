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
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthErrors } from '../../store/slices/userSlice';
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
  const redirectUri = Linking.createURL('/oauth-callback');

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
    const subscription = Linking.addEventListener('url', handleRedirect);
    
    return () => {
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
  
  // Note: When running in Expo Go, biometric authentication may prompt for device 
  // passcode instead of actual Face ID/Touch ID. This is expected behavior in 
  // development. In a production build, proper biometric authentication will be used.
  const handleBiometricAuth = async () => {
    if (!savedCredentials) {
      Alert.alert('No Saved Credentials', 'Please log in with your username and password first.');
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
      Alert.alert('Authentication Failed', 'Please try again or use your password.');
    }
  };

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      Alert.alert('Missing Information', 'Please enter both username/email and password');
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
      // Create a random state parameter for security
      const randomState = Math.random().toString(36).substring(2, 15);
      await SecureStore.setItemAsync('oauth_state', randomState);
      
      // Create properly formatted redirect URL for mobile
      const redirectUrl = Linking.createURL('oauth-callback');
      
      // Launch web browser with state parameter and mobile-specific endpoint
      const authUrl = `${API.AUTH.OAUTH_GOOGLE_MOBILE}?redirect_uri=${encodeURIComponent(redirectUrl)}&state=${randomState}&platform=ios`;
      
      console.log("Opening auth URL:", authUrl);
      
      // Use Expo's authentication session
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl
      );
      
      console.log("Auth result type:", result.type);
      
      if (result.type === 'success') {
        // The URL parameters will be handled by the Linking event handler
        console.log("Login successful, waiting for deep link handler");
      } else if (result.type === 'cancel') {
        console.log("User cancelled login");
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Login Failed', 'Google sign-in could not be completed.');
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
      
      console.log("Apple credential received:", credential.identityToken ? "Token received" : "No token");
      
      // Send the credential to your backend - FIXED: remove /mobile since it doesn't exist
      const response = await fetch(API.AUTH.OAUTH_APPLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
          email: credential.email,
          platform: 'ios' // Add platform indicator instead of using URL path
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
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 100) + "...");
        throw new Error("Server returned non-JSON response");
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Login Failed', error.message || 'Apple sign-in could not be completed.');
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
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>CertGames</Text>
          </View>
          
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue your certification journey</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor="#AAAAAA"
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
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
                placeholder="Password"
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
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            
            {isBiometricAvailable && savedCredentials && (
              <TouchableOpacity 
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
              >
                <Ionicons 
                  name={Platform.OS === 'ios' ? "scan-outline" : "finger-print"} 
                  size={24} 
                  color="#6543CC" 
                />
                <Text style={styles.biometricText}>
                  Sign in with {Platform.OS === 'ios' ? 'Face ID' : 'Touch ID'}
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              {appleAuthAvailable && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={handleAppleLogin}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 30,
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
    marginBottom: 16,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6543CC',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#6543CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#4F4F4F',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderWidth: 1,
    borderColor: '#6543CC',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  biometricText: {
    color: '#6543CC',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 20,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#AAAAAA',
  },
  registerLink: {
    color: '#6543CC',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
