import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { requestPasswordReset } from '../../api/passwordResetService';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();
  
  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await requestPasswordReset(email);
      
      // Always show success even if email doesn't exist (security best practice)
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
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
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#AAAAAA" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#6543CC', '#8A58FC']}
                style={styles.logoBackground}
              >
                <Ionicons name="key" size={30} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address to receive a password reset link
            </Text>
          </View>
          
          {sent ? (
            <View style={styles.successMessage}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Reset Link Sent!</Text>
              <Text style={styles.successText}>
                We've sent instructions to reset your password to <Text style={styles.emailHighlight}>{email}</Text>. 
                Please check your inbox and follow the link to complete the process.
              </Text>
              <Text style={styles.noteText}>
                If you don't see the email, please check your spam folder.
              </Text>
              
              <TouchableOpacity 
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your registered email"
                    placeholderTextColor="#AAAAAA"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="done"
                    editable={!loading}
                  />
                </View>
                
                <TouchableOpacity 
                  style={[styles.resetButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.buttonText}>Sending...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Send Reset Link</Text>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkButton}>Sign In</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={styles.linkText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkButton}>Create Account</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#AAAAAA',
    marginLeft: 8,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    maxWidth: '80%',
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
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 20,
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
  resetButton: {
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
  successMessage: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2ebb77',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2ebb77',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  successText: {
    fontSize: 15,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  backToLoginButton: {
    backgroundColor: 'rgba(101, 67, 204, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6543CC',
  },
  backToLoginText: {
    color: '#6543CC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#AAAAAA',
  },
  linkButton: {
    color: '#6543CC',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(170, 170, 170, 0.2)',
  },
});

export default ForgotPasswordScreen;
