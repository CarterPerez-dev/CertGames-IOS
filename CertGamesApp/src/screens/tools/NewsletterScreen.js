// src/screens/tools/NewsletterScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../../api/newsletterService';
import CustomHeaderComponent from '../../components/CustomHeaderComponent';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const NewsletterScreen = ({ navigation }) => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState([...Array(5)].map(() => new Animated.Value(0)));

  // Component state
  const [email, setEmail] = useState('');
  const [activeSection, setActiveSection] = useState('subscribe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [showStatusMsg, setShowStatusMsg] = useState(false);

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Animation on mount
  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Staggered card animations
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (i * 120),
        useNativeDriver: true
      }).start();
    });
  }, []);

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
      setStatusMsg("Email address.");
      setShowStatusMsg(true);
      return;
    }

    if (!isValidEmail(email)) {
      setIsError(true);
      setStatusMsg("Please enter a valid email address.");
      setShowStatusMsg(true);
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        setStatusMsg(response.message || "Successfully subscribed to the Cyber Brief!");
        // Clear email field on successful subscription
        setEmail("");
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      setShowStatusMsg(true);
    } catch (err) {
      setIsError(true);
      const fallback = "Subscription failed. Please try again.";
      setStatusMsg(err.message || fallback);
      setShowStatusMsg(true);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      setIsError(true);
      setStatusMsg("Email address.");
      setShowStatusMsg(true);
      return;
    }

    if (!isValidEmail(email)) {
      setIsError(true);
      setStatusMsg("Please enter a valid email address.");
      setShowStatusMsg(true);
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        setStatusMsg(response.message || "Successfully unsubscribed from the Cyber Brief.");
        // Clear email field on successful unsubscription
        setEmail("");
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      setShowStatusMsg(true);
    } catch (err) {
      setIsError(true);
      const fallback = "Unsubscribe failed. Please try again.";
      setStatusMsg(err.message || fallback);
      setShowStatusMsg(true);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (section) => {
    if (section !== activeSection) {
      setActiveSection(section);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  return (
    <SafeAreaView style={[globalStyles.screen]}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            opacity: headerOpacity,
            backgroundColor: theme.colors.headerBackground,
            borderBottomColor: theme.colors.border,
          }
        ]}
      >
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
            CYBER BRIEF
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Fixed back button in top left */}
      <TouchableOpacity 
        style={[styles.topBackButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent']}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 1}}
              style={styles.headerBackground}
            >
              <View style={styles.headerContent}>
                <Text style={[styles.mainTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  CERT GAMES CYBER BRIEF
                </Text>
                <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  STAY AHEAD OF CYBER THREATS
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={[globalStyles.container, styles.mainContent]}>
            {/* Intro Card */}
            <Animated.View
              style={{
                opacity: cardAnims[0],
                transform: [{
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={[globalStyles.card, styles.card, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={theme.colors.primaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="shield" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                    INTELLIGENCE
                  </Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <Text style={[globalStyles.text, styles.cardText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    CERT GAMES Cyber Brief: Exam hacks, study strategies, and life tips, delivered weekly.
                  </Text>
                  
                  <View style={styles.features}>
                    <View style={[styles.feature, { 
                      backgroundColor: theme.colors.surfaceHighlight, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
                      <View style={styles.featureTextContainer}>
                        <Text style={[styles.featureTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                          EXAM TIPS
                        </Text>
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                          Expert tips to ace your exams
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.feature, { 
                      backgroundColor: theme.colors.surfaceHighlight, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
                      <View style={styles.featureTextContainer}>
                        <Text style={[styles.featureTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                          LIFE TIPS
                        </Text>
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                          Actionable insights for personal growth.
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.feature, { 
                      backgroundColor: theme.colors.surfaceHighlight, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="construct" size={20} color={theme.colors.primary} />
                      <View style={styles.featureTextContainer}>
                        <Text style={[styles.featureTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                          SECURITY TOOLS
                        </Text>
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                          Practical tutorials for essential tools.
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.feature, { 
                      backgroundColor: theme.colors.surfaceHighlight, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="bulb" size={20} color={theme.colors.primary} />
                      <View style={styles.featureTextContainer}>
                        <Text style={[styles.featureTitle, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                          STUDY TIPS
                        </Text>
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                          Simple hacks for better studying.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Signup Card */}
            <Animated.View
              style={{
                opacity: cardAnims[1],
                transform: [{
                  translateY: cardAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={[globalStyles.card, styles.card, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow 
              }]}>
                <LinearGradient
                  colors={theme.colors.primaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="notifications" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                    JOIN THE CYBER BRIEF NETWORK
                  </Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <TouchableOpacity 
                      style={[
                        styles.tab, 
                        activeSection === 'subscribe' && { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary + '60',
                          borderWidth: 1
                        }
                      ]}
                      onPress={() => handleTabChange('subscribe')}
                    >
                      <Ionicons 
                        name="checkmark" 
                        size={18} 
                        color={activeSection === 'subscribe' ? theme.colors.buttonText : theme.colors.textMuted} 
                      />
                      <Text 
                        style={[
                          styles.tabText, 
                          { 
                            color: activeSection === 'subscribe' ? theme.colors.buttonText : theme.colors.textMuted,
                            fontFamily: 'ShareTechMono',
                            letterSpacing: 0.5
                          }
                        ]}
                      >
                        SUBSCRIBE
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.tab, 
                        activeSection === 'unsubscribe' && { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary + '60',
                          borderWidth: 1
                        }
                      ]}
                      onPress={() => handleTabChange('unsubscribe')}
                    >
                      <Ionicons 
                        name="close" 
                        size={18} 
                        color={activeSection === 'unsubscribe' ? theme.colors.buttonText : theme.colors.textMuted} 
                      />
                      <Text 
                        style={[
                          styles.tabText, 
                          { 
                            color: activeSection === 'unsubscribe' ? theme.colors.buttonText : theme.colors.textMuted,
                            fontFamily: 'ShareTechMono',
                            letterSpacing: 0.5
                          }
                        ]}
                      >
                        UNSUBSCRIBE
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
                        style={[
                          globalStyles.input, 
                          styles.input, 
                          { 
                            backgroundColor: 'transparent', 
                            borderWidth: 0,
                            color: theme.colors.text,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder="Email address"
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
                        style={[
                          globalStyles.buttonPrimary, 
                          styles.submitButton, 
                          { 
                            backgroundColor: theme.colors.primary,
                            shadowColor: theme.colors.shadow
                          }
                        ]}
                        onPress={handleSubscribe}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color={theme.colors.buttonText} />
                            <Text style={[
                              globalStyles.buttonText, 
                              styles.submitButtonText, 
                              { color: theme.colors.buttonText, fontFamily: 'Orbitron' }
                            ]}>
                              SUBSCRIBING...
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="rocket" size={20} color={theme.colors.buttonText} />
                            <Text style={[
                              globalStyles.buttonText, 
                              styles.submitButtonText, 
                              { color: theme.colors.buttonText, fontFamily: 'Orbitron' }
                            ]}>
                              SUBSCRIBE
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[
                          globalStyles.buttonSecondary, 
                          styles.submitButton,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.primary,
                            borderWidth: 1,
                            shadowColor: theme.colors.shadow
                          }
                        ]}
                        onPress={handleUnsubscribe}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={[
                              globalStyles.buttonText, 
                              styles.submitButtonText, 
                              { color: theme.colors.primary, fontFamily: 'Orbitron' }
                            ]}>
                              PROCESSING...
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="close" size={20} color={theme.colors.primary} />
                            <Text style={[
                              globalStyles.buttonText, 
                              styles.submitButtonText, 
                              { color: theme.colors.primary, fontFamily: 'Orbitron' }
                            ]}>
                              UNSUBSCRIBE
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {showStatusMsg && (
                    <View style={[
                      styles.statusMsg,
                      isError ? 
                        { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error } : 
                        { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }
                    ]}>
                      <Ionicons 
                        name={isError ? "alert-circle" : "checkmark-circle"} 
                        size={20} 
                        color={isError ? theme.colors.error : theme.colors.success} 
                      />
                      <Text style={[
                        styles.statusText, 
                        { 
                          color: isError ? theme.colors.error : theme.colors.success,
                          fontFamily: 'ShareTechMono'
                        }
                      ]}>
                        {statusMsg}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Info Card */}
            <Animated.View
              style={{
                opacity: cardAnims[2],
                transform: [{
                  translateY: cardAnims[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={[globalStyles.card, styles.card, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={theme.colors.secondaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="information-circle" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                    ABOUT OUR INTEL NETWORK
                  </Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <Text style={[globalStyles.text, styles.cardText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    Our Cyber Brief is sent a few times every week. We respect your privacy
                    and will never share your email address with third parties. Each newsletter includes
                    an unsubscribe link for easy opt-out at any time.
                  </Text>
                  <Text style={[globalStyles.text, styles.cardText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    Our team of security experts curates the most important cybersecurity news and
                    practical advice to help you protect your digital life and stay informed about
                    the evolving threat landscape.
                  </Text>
                  
                  <View style={[styles.securityBox, { 
                    backgroundColor: theme.colors.surfaceHighlight,
                    borderLeftColor: theme.colors.primary,
                    borderColor: theme.colors.border 
                  }]}>
                    <View style={styles.securityHeader}>
                      <Ionicons name="shield-checkmark" size={18} color={theme.colors.primary} />
                      <Text style={[styles.securityTitle, { 
                        color: theme.colors.text,
                        fontFamily: 'Orbitron-Bold'
                      }]}>
                        SECURITY COMMITMENT
                      </Text>
                    </View>
                    <Text style={[styles.securityText, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      Your data is protected with industry-standard encryption and never shared with 
                      third parties. Our privacy-first approach means we only collect what's 
                      necessary to deliver our service.
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
            
            {/* Back Button */}
            <TouchableOpacity 
              style={[styles.backButton, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
              <Text style={[styles.backButtonText, { 
                color: theme.colors.text,
                fontFamily: 'Orbitron'
              }]}>
                BACK TO DASHBOARD
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom space */}
          <View style={styles.bottomSpacer} />
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
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  // Animated Header
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  // Top Back Button
  topBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Header Section
  headerContainer: {
    width: '100%',
    height: 180,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 25,
  },
  mainContent: {
    padding: 15,
  },
  // Cards
  card: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  // Features
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
    letterSpacing: 0.5,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Tabs
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
  // Form
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Status Message
  statusMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  // Security Box
  securityBox: {
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  securityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Bottom space
  bottomSpacer: {
    height: 50,
  }
});

export default NewsletterScreen;
