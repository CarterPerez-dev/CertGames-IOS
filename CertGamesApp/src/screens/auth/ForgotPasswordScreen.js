// src/screens/auth/ForgotPasswordScreen.js
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
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { requestPasswordReset } from '../../api/passwordResetService';
import { submitContactForm } from '../../api/contactService';

const ForgotPasswordScreen = () => {
  // Password reset states
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Contact form states
  const [contactEmail, setContactEmail] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  
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

  const handleContactSubmit = async () => {
    if (!contactEmail) {
      setContactError('Please enter your email address.');
      return;
    }
    
    if (!username) {
      setContactError('Please enter your username.');
      return;
    }
    
    if (!message) {
      setContactError('Please enter a message.');
      return;
    }
    
    if (message.length < 10) {
      setContactError('Message must be at least 10 characters.');
      return;
    }
    
    setContactLoading(true);
    setContactError('');
    
    try {
      // Format message to include username for context
      const formattedMessage = `Username: ${username}\n\n${message}`;
      
      const response = await submitContactForm({
        email: contactEmail,
        message: formattedMessage
      });
      
      if (response.success) {
        setContactSent(true);
        setContactEmail('');
        setUsername('');
        setMessage('');
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err) {
      setContactError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
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
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={22} color="#AAAAAA" />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
              
              <View style={styles.header}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  style={styles.logoContainer}
                >
                  <Ionicons name="key" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.headerTitle}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  If you signed up through our website and forgot your password, please enter your email address to receive a password reset link
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
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your email"
                          placeholderTextColor="#AAAAAA"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          returnKeyType="done"
                          editable={!loading}
                        />
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.resetButton}
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
                            <Text style={styles.buttonText}>Sending...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              {/* iOS User Support Section */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>iOS App Users</Text>
                <View style={styles.separatorLine} />
              </View>
              
              <View style={styles.iosNotice}>
                <Ionicons name="information-circle" size={24} color="#6543CC" />
                <Text style={styles.iosNoticeText}>
                  If you registered through the iOS app and need password assistance,
                  please contact our support team using the form below:
                </Text>
              </View>
              
              {contactSent ? (
                <View style={styles.contactSuccessMessage}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                  </View>
                  <Text style={styles.successTitle}>Message Sent!</Text>
                  <Text style={styles.successText}>
                    We've received your request and will get back to you as soon as possible.
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
                  {contactError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                      <Text style={styles.errorText}>{contactError}</Text>
                    </View>
                  )}
                  
                  <View style={styles.contactForm}>
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your email"
                          placeholderTextColor="#AAAAAA"
                          value={contactEmail}
                          onChangeText={setContactEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          returnKeyType="next"
                          editable={!contactLoading}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your username"
                          placeholderTextColor="#AAAAAA"
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="none"
                          returnKeyType="next"
                          editable={!contactLoading}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputLabel}>Message</Text>
                      <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <TextInput
                          style={styles.textArea}
                          placeholder="Describe your issue"
                          placeholderTextColor="#AAAAAA"
                          value={message}
                          onChangeText={setMessage}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          returnKeyType="done"
                          editable={!contactLoading}
                        />
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={handleContactSubmit}
                      disabled={contactLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#2EBB77', '#25A367']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {contactLoading ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator color="#FFFFFF" />
                            <Text style={styles.buttonText}>Sending...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Send Message</Text>
                          </View>
                        )}
                      </LinearGradient>
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
    maxWidth: '80%',
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
    marginBottom: 30,
  },
  contactForm: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrap: {
    marginBottom: 20,
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
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  textArea: {
    flex: 1,
    height: 120,
    color: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlignVertical: 'top',
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
  resetButton: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  contactButton: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2EBB77',
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
  successMessage: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2ebb77',
  },
  contactSuccessMessage: {
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
    shadowColor: 'rgba(46, 187, 119, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6543CC',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
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
  // Separator styles
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  separatorText: {
    color: '#6543CC',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    fontSize: 16,
  },
  // iOS Notice styles
  iosNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#6543CC',
    alignItems: 'flex-start',
  },
  iosNoticeText: {
    color: '#AAAAAA',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  }
});

export default ForgotPasswordScreen;
