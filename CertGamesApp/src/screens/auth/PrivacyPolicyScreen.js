// src/screens/auth/PrivacyPolicyScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';


const SCROLL_OFFSET = 800;

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({}).current;
  
  // Sections for easy navigation
  const sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'information', title: '2. Information We Collect' },
    { id: 'use', title: '3. How We Use Your Information' },
    { id: 'share', title: '4. How We Share Your Information' },
    { id: 'security', title: '5. Data Security' },
    { id: 'rights', title: '6. Your Data Rights' },
    { id: 'cookies', title: '7. Cookies and Similar Technologies' },
    { id: 'authentication', title: '8. Third-Party Authentication' },
    { id: 'children', title: '9. Children\'s Privacy' },
    { id: 'appleData', title: '10. Apple-Specific Data Collection' },
    { id: 'dataRetention', title: '11. Data Retention' },
    { id: 'changes', title: '12. Changes to This Privacy Policy' },
    { id: 'contact', title: '13. Contact Us' },
  ];
  
  // Function to scroll to a specific section
  const scrollToSection = (sectionId) => {
    if (scrollViewRef.current && sectionPositions[sectionId] !== undefined) {
      const targetY = sectionPositions[sectionId];
      const adjustedY = targetY + SCROLL_OFFSET;
      scrollViewRef.current.scrollTo({
        y: adjustedY,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#121212', '#1a1a2e']}
        style={styles.gradientBackground}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#AAAAAA" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Ionicons name="shield-checkmark-outline" size={30} color="#6543CC" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
        <Text style={styles.headerDate}>Last updated: April 04, 2025</Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#FF4C8B" />
            <Text style={styles.summaryTitle}>Document Summary</Text>
          </View>
          <Text style={styles.summaryText}>
            This Privacy Policy explains how we collect, use, and protect your personal information. 
            We value your privacy and are committed to transparency about our data practices.
          </Text>
        </View>
        
        {/* Table of Contents */}
        <View style={styles.tocContainer}>
          <View style={styles.tocHeader}>
            <Ionicons name="list-outline" size={20} color="#6543CC" />
            <Text style={styles.tocTitle}>Table of Contents</Text>
          </View>
          
          <View style={styles.tocContent}>
            {sections.map((section, index) => (
              <TouchableOpacity 
                key={section.id} 
                style={styles.tocItem}
                onPress={() => scrollToSection(section.id)}
              >
                <Text style={styles.tocItemText}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Document Content */}
        <View style={styles.documentContent}>
          <View 
            style={styles.section} 
            id="introduction"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['introduction'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              This Privacy Policy explains how Cert Games ("we", "us", or "our") collects, uses, and shares your information when you use our mobile application and services.
            </Text>
            <Text style={styles.paragraph}>
              We take your privacy seriously and are committed to protecting your personal information. Please read this policy carefully to understand our practices regarding your data.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="information"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['information'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect several types of information from and about users of our app, including:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Account Information:</Text> When you register for an account, we collect your username and, if you choose to provide it, your email address. We need this minimum information to create and maintain your account.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Authentication Information:</Text> When you sign in using Google or Apple, we receive basic profile information such as your name and email address from the authentication provider, but we do not receive or store your passwords for these services.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>App Usage Data:</Text> Information about how you interact with our app, including tests taken, scores, progress tracking, achievements, and usage patterns. This helps us improve your experience and provide personalized content.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Payment Information:</Text> When you purchase a subscription, payment information is processed by Apple's App Store. We do not collect, see, or store your payment details like credit card numbers.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>In-App Activity:</Text> We collect information about your activity within the app, such as the features you use, how long you use them, and your interactions with content.</Text>
            </View>
          </View>
          
          <View 
            style={styles.section} 
            id="use"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['use'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Provide, maintain, and improve our services</Text>
              <Text style={styles.listItem}>• Process your account registration and maintain your account</Text>
              <Text style={styles.listItem}>• Track your progress, achievements, and leaderboard status</Text>
              <Text style={styles.listItem}>• Communicate with you about your account, updates, or support requests</Text>
              <Text style={styles.listItem}>• Personalize your experience and deliver relevant content</Text>
              <Text style={styles.listItem}>• Process transactions and manage your subscription</Text>
              <Text style={styles.listItem}>• Analyze usage patterns to improve our app and services</Text>
              <Text style={styles.listItem}>• Detect, prevent, and address technical issues or fraud</Text>
            </View>
          </View>
          
          <View 
            style={styles.section} 
            id="share"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['share'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>4. How We Share Your Information</Text>
            <Text style={styles.paragraph}>
              We do not sell your personal information to third parties. We may share your information in the following circumstances:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Service Providers:</Text> We share information with trusted service providers who perform services on our behalf, such as hosting providers, authentication services, and analytics providers. These providers are contractually obligated to use your data only for providing services to us.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Legal Requirements:</Text> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Business Transfers:</Text> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>With Your Consent:</Text> We may share your information with third parties when we have your consent to do so.</Text>
            </View>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                <Text style={styles.bold}>Note:</Text> When information is shared with service providers, we ensure they have appropriate data protection measures in place.
              </Text>
            </View>
          </View>
          
          <View 
            style={styles.section} 
            id="security"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['security'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>5. Data Security</Text>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Encryption of sensitive data in transit and at rest</Text>
              <Text style={styles.listItem}>• Regular security assessments and testing</Text>
              <Text style={styles.listItem}>• Access controls and authentication requirements</Text>
              <Text style={styles.listItem}>• Secure password storage using industry-standard hashing algorithms</Text>
            </View>
            <Text style={styles.paragraph}>
              However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="rights"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['rights'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>6. Your Data Rights</Text>
            <Text style={styles.paragraph}>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Access:</Text> You can request a copy of the personal information we hold about you.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Correction:</Text> You can request that we correct inaccurate or incomplete information.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Deletion:</Text> You can request that we delete your personal information. You can delete your account at any time via the Profile screen in the app.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Restriction:</Text> You can request that we restrict processing of your personal information.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Data Portability:</Text> You can request a copy of your data in a structured, commonly used, machine-readable format.</Text>
            </View>
            <Text style={styles.paragraph}>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="cookies"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['cookies'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>7. Cookies and Similar Technologies</Text>
            <Text style={styles.paragraph}>
              Our mobile application uses local storage and similar technologies to remember your preferences and settings. Unlike website cookies, mobile app local storage remains on your device and is not shared across the internet.
            </Text>
            <Text style={styles.paragraph}>
              We use these technologies for the following purposes:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• To maintain your authentication state</Text>
              <Text style={styles.listItem}>• To remember your settings and preferences</Text>
              <Text style={styles.listItem}>• To store progress data when offline</Text>
              <Text style={styles.listItem}>• To improve performance of the application</Text>
            </View>
            <Text style={styles.paragraph}>
              You can clear the app's local storage by uninstalling the application, though this will also remove your locally stored progress.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="authentication"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['authentication'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>8. Third-Party Authentication</Text>
            <Text style={styles.paragraph}>
              Our service offers sign-in through Google and Apple authentication services. When you choose to sign in using these services:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• We receive basic profile information including your name and email address</Text>
              <Text style={styles.listItem}>• We do not receive your password or account details</Text>
              <Text style={styles.listItem}>• We store a unique identifier to recognize your account</Text>
            </View>
            <Text style={styles.paragraph}>
              Your use of Google or Apple sign-in is also subject to their respective privacy policies:
            </Text>
            <View style={styles.links}>
              <TouchableOpacity 
                style={styles.link}
                onPress={() => Linking.openURL('https://policies.google.com/privacy')}
              >
                <Text style={styles.linkText}>
                  Google Privacy Policy <Ionicons name="open-outline" size={14} color="#6543CC" />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.link}
                onPress={() => Linking.openURL('https://www.apple.com/legal/privacy/')}
              >
                <Text style={styles.linkText}>
                  Apple Privacy Policy <Ionicons name="open-outline" size={14} color="#6543CC" />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View 
            style={styles.section} 
            id="children"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['children'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Our services are not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us so that we can take appropriate steps.
            </Text>
            <Text style={styles.paragraph}>
              If we learn that we have collected personal information from a child under 13, we will take steps to delete that information as soon as possible.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="appleData"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['appleData'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>10. Apple-Specific Data Collection</Text>
            <Text style={styles.paragraph}>
              For users who download our app from the Apple App Store:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• <Text style={styles.bold}>App Tracking Transparency:</Text> We respect your choices regarding tracking across apps and websites owned by other companies. If you opt out of tracking via Apple's App Tracking Transparency feature, we will not track your activity across other companies' apps and websites.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>In-App Purchases:</Text> All payments and subscriptions are processed through Apple's App Store. We do not collect or store your payment information. Your purchase history is subject to Apple's Privacy Policy.</Text>
              <Text style={styles.listItem}>• <Text style={styles.bold}>Apple Sign-in:</Text> If you use Apple Sign-in, we only receive the information you authorize Apple to share with us. At minimum, this includes a unique identifier that we use to create and manage your account.</Text>
            </View>
            <Text style={styles.paragraph}>
              Apple may collect additional information about your interactions with our app. Please refer to Apple's Privacy Policy for more information about their data practices.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="dataRetention"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['dataRetention'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>11. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete or anonymize your personal information within a reasonable time period, except where we need to retain certain information for legitimate business or legal purposes.
            </Text>
            <Text style={styles.paragraph}>
              Information we retain after account deletion may include:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Aggregated analytics data that does not identify you personally</Text>
              <Text style={styles.listItem}>• Information necessary for our legitimate business interests, such as fraud prevention</Text>
              <Text style={styles.listItem}>• Information we are required to keep for legal reasons</Text>
            </View>
          </View>
          
          <View 
            style={styles.section} 
            id="changes"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['changes'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>12. Changes to This Privacy Policy</Text>
            <Text style={styles.paragraph}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </Text>
            <Text style={styles.paragraph}>
              For significant changes, we will provide a more prominent notice, which may include an in-app notification. We encourage you to review this Privacy Policy periodically for any changes.
            </Text>
          </View>
          
          <View 
            style={styles.section} 
            id="contact"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sectionPositions['contact'] = layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>13. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email: </Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:support@certgames.com')}>
                <Text style={styles.contactLink}>support@certgames.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: 'rgba(25, 25, 35, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  summaryText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  tocContainer: {
    backgroundColor: 'rgba(25, 25, 35, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  tocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tocTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tocContent: {
  },
  tocItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  tocItemText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  documentContent: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'rgba(30, 30, 45, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6543CC',
  },
  paragraph: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  list: {
    marginVertical: 10,
    paddingLeft: 5,
  },
  listItem: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  callout: {
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#6543CC',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  calloutText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  links: {
    marginTop: 10,
  },
  link: {
    marginBottom: 8,
  },
  linkText: {
    color: '#6543CC',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  contactInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  contactLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  contactLink: {
    color: '#6543CC',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default PrivacyPolicyScreen;
