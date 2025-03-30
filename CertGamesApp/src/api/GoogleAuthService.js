// src/api/GoogleAuthService.js
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';
import { API } from './apiConfig';

class GoogleAuthService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      GoogleSignin.configure({
        // This is your iOS client ID from Google Console
        iosClientId: '64761236473-3as2ugjri0ql0snujt83fei049dvvr4g.apps.googleusercontent.com',
        // This is your web client ID from Google Console
        webClientId: '64761236473-lelipb60k4u41aqeviqdobsc0kjj8pca.apps.googleusercontent.com',
        // Optional: these fields would be needed if you're using additional scopes
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email']
      });
      this.initialized = true;
      console.log('[GoogleAuthService] Initialized successfully');
    } catch (error) {
      console.error('[GoogleAuthService] Failed to initialize:', error);
      throw error;
    }
  }

  async signIn() {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
  
      // Check if Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('[GoogleAuthService] Sign in successful:', userInfo);
      
      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('[GoogleAuthService] Tokens received');
      
      // Send to backend for verification and user creation/retrieval
      const response = await this.verifyWithBackend(userInfo, tokens.accessToken);
      
      // Store user ID
      if (response.userId) {
        await SecureStore.setItemAsync('userId', response.userId);
      }
      
      return response;
    } catch (error) {
      console.error('[GoogleAuthService] Sign in error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available or outdated');
      }
      
      throw error;
    }
  }
  
  async verifyWithBackend(userInfo, accessToken) {
    try {
      // Fix: Access data correctly from the Google Sign-In response structure
      const userData = userInfo.data.user;
      
      console.log('[GoogleAuthService] Sending user data to backend:', {
        email: userData.email,
        name: userData.name,
        id: userData.id
      });
      
      const response = await apiClient.post(API.AUTH.VERIFY_GOOGLE_TOKEN, {
        token: accessToken,
        userData: {
          email: userData.email,
          name: userData.name,
          id: userData.id
        },
        platform: 'ios'
      });
      
      return response.data;
    } catch (error) {
      console.error('[GoogleAuthService] Backend verification error:', error);
      throw error;
    }
  }
  
  
  async signOut() {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await SecureStore.deleteItemAsync('userId');
      console.log('[GoogleAuthService] Sign out successful');
      return true;
    } catch (error) {
      console.error('[GoogleAuthService] Sign out error:', error);
      throw error;
    }
  }
  
  async isSignedIn() {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('[GoogleAuthService] Check sign in status error:', error);
      return false;
    }
  }
  
  async getCurrentUser() {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('[GoogleAuthService] Get current user error:', error);
      return null;
    }
  }
}

// Export as singleton
export default new GoogleAuthService();
