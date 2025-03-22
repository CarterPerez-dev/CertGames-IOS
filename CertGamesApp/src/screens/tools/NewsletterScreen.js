// src/screens/tools/NewsletterScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../../api/newsletterService';
import CustomHeaderComponent from '../../components/CustomHeaderComponent';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const NewsletterScreen = () => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  const [email, setEmail] = useState('');
  const [activeSection, setActiveSection] = useState('subscribe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [showStatusMsg, setShowStatusMsg] = useState(false);

  // Clear status message after 5 seconds
  useEffect(() => {
    if (statusMsg && showStatusMsg) {
      const timer = setTimeout(() => {
        setShowStatusMsg(false);
        setTimeout(() => setStatusMsg(''), 300); // Clear message after fade-out
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg, showStatusMsg]);

  // Email validation
  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubscribe = async () => {
    if (!email) {
      setIsError(true);
      setStatusMsg("Please enter your email address.");
      setShowStatusMsg(true);
      return;
    }

    if (!isValidEmail(email)) {
      setIsError(true);
      setStatusMsg("Please enter a valid email address.");
      setShowStatusMsg(true);
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("");
    setShowStatusMsg(false);
    
    try {
      const response = await subscribeToNewsletter(email);
      
      // Check if the response indicates success or informational failure
      if (response.success === false) {
        // Handle already subscribed case specifically
        setIsError(false); // Not a true error, just information
        setStatusMsg(response.message || "Already subscribed.");
      } else {
        setIsError(false);
        setStatusMsg(response.message || "Successfully subscribed to the Daily Cyber Brief!");
        // Clear email field on successful subscription
        setEmail("");
      }
      setShowStatusMsg(true);
    } catch (err) {
      setIsError(true);
      const fallback = "Subscription failed. Please try again.";
      setStatusMsg(err.message || fallback);
      setShowStatusMsg(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      setIsError(true);
      setStatusMsg("Please enter your email address to unsubscribe.");
      setShowStatusMsg(true);
      return;
    }

    if (!isValidEmail(email)) {
      setIsError(true);
      setStatusMsg("Please enter a valid email address.");
      setShowStatusMsg(true);
      return;
    }

    setIsSubmitting(true);
    setStatusMsg("");
    setShowStatusMsg(false);
    
    try {
      const response = await unsubscribeFromNewsletter(email);
      
      // Check if the response indicates success or informational failure
      if (response.success === false) {
        // Handle not subscribed case specifically
        setIsError(false); // Not a true error, just information
        setStatusMsg(response.message || "Email not found in subscriber list.");
      } else {
        setIsError(false);
        setStatusMsg(response.message || "Successfully unsubscribed from the Daily Cyber Brief.");
        // Clear email field on successful unsubscription
        setEmail("");
      }
      setShowStatusMsg(true);
    } catch (err) {
      setIsError(true);
      const fallback = "Unsubscribe failed. Please try again.";
      setStatusMsg(err.message || fallback);
      setShowStatusMsg(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (activeSection === "subscribe") {
        handleSubscribe();
      } else {
        handleUnsubscribe();
      }
    }
  };

  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* Custom Header - Moved inside ScrollView to scroll with content */}
          <View style={styles.compactHeaderContainer}>
            <CustomHeaderComponent 
              title="Cyber Brief" 
              gradientColors={theme.colors.primaryGradient}
              // Use custom style prop for smaller header
              customStyles={styles.compactHeader}
            />
          </View>
          
          <View style={[globalStyles.container, styles.mainContent]}>
            {/* Intro Card */}
            <View style={[globalStyles.card, styles.card]}>
              <LinearGradient
                colors={theme.colors.primaryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="shield" size={20} color={theme.colors.text} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Stay Ahead of Cyber Threats</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <Text style={[globalStyles.text, styles.cardText]}>
                  The Daily Cyber Brief delivers curated, actionable cybersecurity intelligence 
                  directly to your inbox. Stay informed about emerging threats, security best 
                  practices, and industry trends.
                </Text>
                
                <View style={styles.features}>
                  <View style={[styles.feature, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                    <Ionicons name="lock-closed" size={20} color={theme.colors.secondary} />
                    <View style={styles.featureTextContainer}>
                      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Threat Intelligence</Text>
                      <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Get the latest on emerging cyber threats and vulnerabilities</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.feature, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                    <Ionicons name="trending-up" size={20} color={theme.colors.secondary} />
                    <View style={styles.featureTextContainer}>
                      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Industry Trends</Text>
                      <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Track industry trends and stay ahead of the curve</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.feature, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                    <Ionicons name="construct" size={20} color={theme.colors.secondary} />
                    <View style={styles.featureTextContainer}>
                      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Security Tools</Text>
                      <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Practical security tools and techniques for implementation</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.feature, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                    <Ionicons name="bulb" size={20} color={theme.colors.secondary} />
                    <View style={styles.featureTextContainer}>
                      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Expert Insights</Text>
                      <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Gain insights from security experts and thought leaders</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Signup Card */}
            <View style={[globalStyles.card, styles.card]}>
              <LinearGradient
                colors={theme.colors.primaryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="notifications" size={20} color={theme.colors.text} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Join the Cyber Brief Community</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <View style={[styles.tabs, { backgroundColor: theme.colors.inputBackground }]}>
                  <TouchableOpacity 
                    style={[
                      styles.tab, 
                      activeSection === 'subscribe' && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setActiveSection('subscribe')}
                  >
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={activeSection === 'subscribe' ? theme.colors.textInverse : theme.colors.textMuted} 
                    />
                    <Text 
                      style={[
                        styles.tabText, 
                        { color: activeSection === 'subscribe' ? theme.colors.textInverse : theme.colors.textMuted }
                      ]}
                    >
                      Subscribe
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.tab, 
                      activeSection === 'unsubscribe' && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setActiveSection('unsubscribe')}
                  >
                    <Ionicons 
                      name="close" 
                      size={18} 
                      color={activeSection === 'unsubscribe' ? theme.colors.textInverse : theme.colors.textMuted} 
                    />
                    <Text 
                      style={[
                        styles.tabText, 
                        { color: activeSection === 'unsubscribe' ? theme.colors.textInverse : theme.colors.textMuted }
                      ]}
                    >
                      Unsubscribe
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBackground, 
                      borderColor: theme.colors.inputBorder 
                    }
                  ]}>
                    <Ionicons name="mail" size={20} color={theme.colors.icon} style={styles.inputIcon} />
                    <TextInput
                      style={[globalStyles.input, styles.input, { backgroundColor: 'transparent', borderWidth: 0 }]}
                      placeholder="Enter your email address"
                      placeholderTextColor={theme.colors.placeholder}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isSubmitting}
                      onSubmitEditing={() => activeSection === 'subscribe' ? handleSubscribe() : handleUnsubscribe()}
                    />
                  </View>

                  {activeSection === 'subscribe' ? (
                    <TouchableOpacity 
                      style={[globalStyles.buttonPrimary, styles.submitButton]}
                      onPress={handleSubscribe}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color={theme.colors.buttonText} />
                          <Text style={[globalStyles.buttonText, styles.submitButtonText]}>Subscribing...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="rocket" size={20} color={theme.colors.buttonText} />
                          <Text style={[globalStyles.buttonText, styles.submitButtonText]}>Subscribe to Daily Updates</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[globalStyles.buttonSecondary, styles.submitButton]}
                      onPress={handleUnsubscribe}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color={theme.colors.buttonText} />
                          <Text style={[globalStyles.buttonText, styles.submitButtonText]}>Processing...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="close" size={20} color={theme.colors.buttonText} />
                          <Text style={[globalStyles.buttonText, styles.submitButtonText]}>Unsubscribe from Updates</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {showStatusMsg && (
                  <View style={[
                    styles.statusMsg,
                    isError ? globalStyles.errorContainer : globalStyles.successContainer
                  ]}>
                    <Ionicons 
                      name={isError ? "alert-circle" : "checkmark-circle"} 
                      size={20} 
                      color={isError ? theme.colors.error : theme.colors.success} 
                    />
                    <Text style={isError ? globalStyles.errorText : globalStyles.successText}>{statusMsg}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info Card */}
            <View style={[globalStyles.card, styles.card]}>
              <LinearGradient
                colors={theme.colors.primaryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="information-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>About Our Newsletter</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <Text style={[globalStyles.text, styles.cardText]}>
                  The Daily Cyber Brief is sent every weekday morning. We respect your privacy
                  and will never share your email address with third parties. Each newsletter includes
                  an unsubscribe link for easy opt-out at any time.
                </Text>
                <Text style={[globalStyles.text, styles.cardText]}>
                  Our team of security experts curates the most important cybersecurity news and
                  practical advice to help you protect your digital life and stay informed about
                  the evolving threat landscape.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // New styles for compact header
  compactHeaderContainer: {
    overflow: 'hidden',
  },
  compactHeader: {
    paddingTop: Platform.OS === 'ios' ? 30 : 10, // ~30% smaller (was 44:16)
    paddingBottom: 10, // ~30% smaller (was 16)
    height: Platform.OS === 'ios' ? 70 : 50, // Add explicit height constraint
  },
  mainContent: {
    padding: 15,
  },
  card: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 20,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  features: {
    marginTop: 10,
  },
  feature: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  featureTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButton: {
    borderRadius: 8,
    padding: 15,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
});

export default NewsletterScreen;
