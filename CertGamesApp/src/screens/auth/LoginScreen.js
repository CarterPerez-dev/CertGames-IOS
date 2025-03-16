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
      Alert.alert('Error', 'Please enter both username/email and password');
      return;
    }
    
    try {
      await dispatch(loginUser({ usernameOrEmail, password })).unwrap();
      
      // If login successful, save credentials for biometric login
      await SecureStore.setItemAsync('userCredentials', JSON.stringify({
        usernameOrEmail,
        password
      }));
      
      // Navigation is handled by the app navigator once user is set in Redux
    } catch (err) {
      // Error is already handled in the reducer
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      // Launch web browser for Google OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        `${API.AUTH.OAUTH_GOOGLE}?redirect_uri=${encodeURIComponent(redirectUri)}`,
        redirectUri
      );
      
      if (result.type === 'success') {
        // Handle success, parsing any query params if needed
        // This might be handled by the deep link handler instead
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
      
      // Send the credential to your backend
      const response = await fetch(`${API.AUTH.OAUTH_APPLE}/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
          email: credential.email,
        }),
      });
      
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
        }
      } else {
        throw new Error(data.error || 'Apple sign-in failed');
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Login Failed', error.message || 'Apple sign-in could not be completed.');
    }
  };
  
  const handleRedirect = (event) => {
    // Extract userId and other params from the URL
    const { url } = event;
    const params = Linking.parse(url).queryParams;
    
    if (params.userId) {
      // Store user ID and set in Redux
      SecureStore.setItemAsync('userId', params.userId);
      dispatch({ type: 'user/setCurrentUserId', payload: params.userId });
      
      // If the user needs to set a username, navigate to that screen
      if (params.needsUsername === 'true') {
        navigation.navigate('CreateUsername', { 
          userId: params.userId, 
          provider: params.provider 
        });
      }
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
                  name={Platform.OS === 'ios' ? "ios-face-id" : "ios-finger-print"} 
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
