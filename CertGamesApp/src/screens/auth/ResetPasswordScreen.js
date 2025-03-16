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
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { verifyResetToken, resetPassword } from '../../api/passwordResetService';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinimumLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const navigation = useNavigation();
  const route = useRoute();
  const token = route.params?.token;
  
  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError('No reset token provided');
        setVerifyLoading(false);
        return;
      }
      
      setVerifyLoading(true);
      
      try {
        const response = await verifyResetToken(token);
        if (response && response.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(response?.error || 'Invalid or expired token');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setTokenValid(false);
        setError('Failed to verify reset token. Please try again.');
      } finally {
        setVerifyLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  // Update password validation whenever password changes
  useEffect(() => {
    setPasswordValidation({
      hasMinimumLength: newPassword.length >= 6,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*()\-_=+[\]{}|;:'",<.>/?`~\\]/.test(newPassword)
    });
  }, [newPassword]);
  
  const passwordIsValid = () => {
    return Object.values(passwordValidation).every(val => val === true);
  };
  
  const handleSubmit = async () => {
    setError('');
    
    // Basic validation
    if (!newPassword || !confirmPassword) {
      setError('Both fields are required');
      return;
    }
    
    if (!passwordIsValid()) {
      setError('Password does not meet all requirements');
      setShowRequirements(true);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
      
      // Redirect to login page after showing success message
      setTimeout(() => {
        navigation.navigate('Login');
      }, 5000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying token
  if (verifyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#121212', '#1a1a2e']}
          style={styles.gradientBackground}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={styles.loadingText}>Verifying reset token...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={() => navigation.navigate('Login')}
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
            <Text style={styles.headerTitle}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Create a new, strong password for your account
            </Text>
          </View>
          
          {!tokenValid ? (
            <View style={styles.errorState}>
              <Ionicons name="close-circle" size={60} color="#ff4e4e" style={styles.errorIcon} />
              <Text style={styles.errorTitle}>Invalid or Expired Link</Text>
              <Text style={styles.errorMessage}>
                This password reset link is invalid or has expired. 
                Please request a new password reset link.
              </Text>
              <TouchableOpacity 
                style={styles.requestNewButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.requestNewText}>Request New Reset Link</Text>
              </TouchableOpacity>
            </View>
          ) : success ? (
            <View style={styles.successMessage}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Password Reset Successfully!</Text>
              <Text style={styles.successText}>
                Your password has been updated. You can now log in with your new password.
              </Text>
              <Text style={styles.redirectText}>
                Redirecting to login page in a few seconds...
              </Text>
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
                  <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your new password"
                    placeholderTextColor="#AAAAAA"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    editable={!loading}
                    onFocus={() => setShowRequirements(true)}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#AAAAAA" 
                    />
                  </TouchableOpacity>
                </View>
                
                {showRequirements && (
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
                    placeholder="Confirm your new password"
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
                
                {newPassword && confirmPassword && (
                  <View style={[
                    styles.passwordMatch,
                    newPassword === confirmPassword ? styles.matchSuccess : styles.matchError
                  ]}>
                    <Ionicons 
                      name={newPassword === confirmPassword ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={newPassword === confirmPassword ? "#2ebb77" : "#ff4e4e"} 
                    />
                    <Text style={[
                      styles.matchText,
                      newPassword === confirmPassword ? styles.matchSuccessText : styles.matchErrorText
                    ]}>
                      {newPassword === confirmPassword ? "Passwords match" : "Passwords don't match"}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[styles.resetButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.buttonText}>Resetting Password...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Reset Password</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    marginTop: 20,
    fontSize: 16,
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
    marginBottom: 15,
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
  matchText: {
    marginLeft: 8,
    fontSize: 13,
  },
  matchSuccess: {
    color: '#2ebb77',
  },
  matchError: {
    color: '#ff4e4e',
  },
  matchSuccessText: {
    color: '#2ebb77',
  },
  matchErrorText: {
    color: '#ff4e4e',
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
  errorState: {
    backgroundColor: 'rgba(255, 78, 78, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 15,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  requestNewButton: {
    backgroundColor: '#6543CC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  requestNewText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
  redirectText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
});

export default ResetPasswordScreen;
