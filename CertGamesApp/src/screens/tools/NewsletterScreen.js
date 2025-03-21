import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../../api/newsletterService';
import CustomHeaderComponent from '../../components/CustomHeaderComponent';

const NewsletterScreen = () => {
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
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <CustomHeaderComponent 
        title="Daily Cyber Brief" 
        subtitle="Your essential cybersecurity intelligence"
        gradientColors={['#6543CC', '#1E1E2E']}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header Section - Removed in favor of CustomHeader */}
          <View style={styles.mainContent}>
            {/* Intro Card */}
            <View style={styles.card}>
              <LinearGradient
                colors={['#6543CC', '#8A58FC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="shield" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Stay Ahead of Cyber Threats</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>
                  The Daily Cyber Brief delivers curated, actionable cybersecurity intelligence 
                  directly to your inbox. Stay informed about emerging threats, security best 
                  practices, and industry trends.
                </Text>
                
                <View style={styles.features}>
                  <View style={styles.feature}>
                    <Ionicons name="lock-closed" size={20} color="#FF4C8B" />
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Threat Intelligence</Text>
                      <Text style={styles.featureText}>Get the latest on emerging cyber threats and vulnerabilities</Text>
                    </View>
                  </View>
                  
                  <View style={styles.feature}>
                    <Ionicons name="trending-up" size={20} color="#FF4C8B" />
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Industry Trends</Text>
                      <Text style={styles.featureText}>Track industry trends and stay ahead of the curve</Text>
                    </View>
                  </View>
                  
                  <View style={styles.feature}>
                    <Ionicons name="construct" size={20} color="#FF4C8B" />
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Security Tools</Text>
                      <Text style={styles.featureText}>Practical security tools and techniques for implementation</Text>
                    </View>
                  </View>
                  
                  <View style={styles.feature}>
                    <Ionicons name="bulb" size={20} color="#FF4C8B" />
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Expert Insights</Text>
                      <Text style={styles.featureText}>Gain insights from security experts and thought leaders</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Signup Card */}
            <View style={styles.card}>
              <LinearGradient
                colors={['#6543CC', '#8A58FC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Join the Cyber Brief Community</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <View style={styles.tabs}>
                  <TouchableOpacity 
                    style={[styles.tab, activeSection === 'subscribe' && styles.activeTab]}
                    onPress={() => setActiveSection('subscribe')}
                  >
                    <Ionicons name="checkmark" size={18} color={activeSection === 'subscribe' ? "#FFFFFF" : "#AAAAAA"} />
                    <Text style={[styles.tabText, activeSection === 'subscribe' && styles.activeTabText]}>Subscribe</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.tab, activeSection === 'unsubscribe' && styles.activeTab]}
                    onPress={() => setActiveSection('unsubscribe')}
                  >
                    <Ionicons name="close" size={18} color={activeSection === 'unsubscribe' ? "#FFFFFF" : "#AAAAAA"} />
                    <Text style={[styles.tabText, activeSection === 'unsubscribe' && styles.activeTabText]}>Unsubscribe</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail" size={20} color="#AAAAAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor="#AAAAAA"
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
                      style={styles.submitButton}
                      onPress={handleSubscribe}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Subscribing...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="rocket" size={20} color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Subscribe to Daily Updates</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.submitButton, styles.unsubscribeButton]}
                      onPress={handleUnsubscribe}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Processing...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="close" size={20} color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Unsubscribe from Updates</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {showStatusMsg && (
                  <View style={[
                    styles.statusMsg,
                    isError ? styles.errorMsg : styles.successMsg
                  ]}>
                    <Ionicons 
                      name={isError ? "alert-circle" : "checkmark-circle"} 
                      size={20} 
                      color={isError ? "#FF4E4E" : "#2EBB77"} 
                    />
                    <Text style={styles.statusText}>{statusMsg}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.card}>
              <LinearGradient
                colors={['#6543CC', '#8A58FC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.cardHeader}
              >
                <Ionicons name="information-circle" size={20} color="#FFFFFF" />
                <Text style={styles.cardTitle}>About Our Newsletter</Text>
              </LinearGradient>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>
                  The Daily Cyber Brief is sent every weekday morning. We respect your privacy
                  and will never share your email address with third parties. Each newsletter includes
                  an unsubscribe link for easy opt-out at any time.
                </Text>
                <Text style={styles.cardText}>
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
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#171A23',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2C3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 20,
  },
  cardText: {
    color: '#9DA8B9',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  features: {
    marginTop: 10,
  },
  feature: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  featureText: {
    color: '#9DA8B9',
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
  activeTab: {
    backgroundColor: '#6543CC',
  },
  tabText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2C3D',
    marginBottom: 15,
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#6543CC',
    borderRadius: 8,
    padding: 15,
  },
  unsubscribeButton: {
    backgroundColor: '#454545',
  },
  submitButtonText: {
    color: '#FFFFFF',
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
    opacity: 1,
    transform: [{ translateY: 0 }],
    transition: 'opacity 0.3s, transform 0.3s',
  },
  successMsg: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2EBB77',
  },
  errorMsg: {
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF4E4E',
  },
  statusText: {
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
});

export default NewsletterScreen;
