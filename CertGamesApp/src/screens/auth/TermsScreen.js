// src/screens/auth/TermsScreen.js
import React, { useState, useEffect } from 'react';
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

const TermsScreen = () => {
  const navigation = useNavigation();
  
  // Sections for easy navigation
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'changes', title: '2. Changes to Terms' },
    { id: 'registration', title: '3. Account Registration' },
    { id: 'subscription', title: '4. Subscription and Payment' },
    { id: 'conduct', title: '5. User Conduct' },
    { id: 'ip', title: '6. Intellectual Property' },
    { id: 'third-party', title: '7. Third-Party Services' },
    { id: 'disclaimer', title: '8. Disclaimer of Warranties' },
    { id: 'liability', title: '9. Limitation of Liability' },
    { id: 'termination', title: '10. Termination' },
    { id: 'governing-law', title: '11. Governing Law' },
    { id: 'contact', title: '12. Contact Us' },
  ];

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
          <Ionicons name="document-text-outline" size={30} color="#6543CC" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Terms of Service</Text>
        </View>
        <Text style={styles.headerDate}>Last updated: March 30, 2025</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#FF4C8B" />
            <Text style={styles.summaryTitle}>Document Summary</Text>
          </View>
          <Text style={styles.summaryText}>
            This document outlines the terms governing your use of our services, including your responsibilities, 
            our obligations, subscription terms, and your rights. By using our platform, you agree to these terms.
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
              <TouchableOpacity key={section.id} style={styles.tocItem}>
                <Text style={styles.tocItemText}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Document Content */}
        <View style={styles.documentContent}>
          <View style={styles.section} id="acceptance">
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              Welcome to Cert Games! These Terms of Service ("Terms") govern your access to and use of certgames.com and all related services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </Text>
          </View>
          
          <View style={styles.section} id="changes">
            <Text style={styles.sectionTitle}>2. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may modify these Terms at any time. We will provide notice of any material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of the Services after any such changes constitutes your acceptance of the new Terms.
            </Text>
          </View>
          
          <View style={styles.section} id="registration">
            <Text style={styles.sectionTitle}>3. Account Registration</Text>
            <Text style={styles.paragraph}>
              To access certain features of our Services, you must register for an account. You may register directly or through Google or Apple authentication services. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </Text>
            <Text style={styles.paragraph}>
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </Text>
          </View>
          
          <View style={styles.section} id="subscription">
            <Text style={styles.sectionTitle}>4. Subscription and Payment</Text>
            <Text style={styles.paragraph}>
              Some aspects of our Services are available on a subscription basis. By subscribing, you agree to pay the applicable fees. Subscriptions automatically renew unless canceled before the renewal date.
            </Text>
            <Text style={styles.paragraph}>
              All payments are processed through third-party payment processors. Your use of their services is subject to their terms and conditions.
            </Text>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                <Text style={styles.bold}>Note:</Text> You can cancel your subscription at any time through your account settings. Refunds are provided in accordance with our refund policy.
              </Text>
            </View>
          </View>
          
          <View style={styles.section} id="conduct">
            <Text style={styles.sectionTitle}>5. User Conduct</Text>
            <Text style={styles.paragraph}>
              You agree not to:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Use the Services in any manner that could disable, overburden, damage, or impair the Services</Text>
              <Text style={styles.listItem}>• Use any robot, spider, or other automatic device to access the Services</Text>
              <Text style={styles.listItem}>• Introduce any viruses, trojan horses, worms, or other malicious code</Text>
              <Text style={styles.listItem}>• Attempt to gain unauthorized access to any part of the Services</Text>
              <Text style={styles.listItem}>• Interfere with any other user's use of the Services</Text>
              <Text style={styles.listItem}>• Use the Services for any illegal or unauthorized purpose</Text>
              <Text style={styles.listItem}>• Impersonate or attempt to impersonate Cert Games, a Cert Games employee, another user, or any other person or entity</Text>
              <Text style={styles.listItem}>• Engage in any other conduct that restricts or inhibits anyone's use of the Services</Text>
            </View>
          </View>
          
          <View style={styles.section} id="ip">
            <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              The Services and all content, features, and functionality (including but not limited to text, graphics, software, images, videos, and audio) are owned by Cert Games or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </Text>
            <Text style={styles.paragraph}>
              We grant you a limited, non-exclusive, non-transferable, and revocable license to use the Services for your personal, non-commercial use only.
            </Text>
          </View>
          
          <View style={styles.section} id="third-party">
            <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              Our Services may contain links to third-party websites or services that are not owned or controlled by Cert Games. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
            </Text>
            <Text style={styles.paragraph}>
              When you use Google or Apple authentication, your use is subject to their terms of service and privacy policies:
            </Text>
            <View style={styles.links}>
              <TouchableOpacity 
                style={styles.link}
                onPress={() => Linking.openURL('https://policies.google.com/terms')}
              >
                <Text style={styles.linkText}>
                  Google Terms of Service <Ionicons name="open-outline" size={14} color="#6543CC" />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.link}
                onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/us/terms.html')}
              >
                <Text style={styles.linkText}>
                  Apple Terms of Service <Ionicons name="open-outline" size={14} color="#6543CC" />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section} id="disclaimer">
            <Text style={styles.sectionTitle}>8. Disclaimer of Warranties</Text>
            <Text style={styles.importantText}>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </Text>
          </View>
          
          <View style={styles.section} id="liability">
            <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
            <Text style={styles.importantText}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CERT GAMES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </Text>
          </View>
          
          <View style={styles.section} id="termination">
            <Text style={styles.sectionTitle}>10. Termination</Text>
            <Text style={styles.paragraph}>
              We may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </Text>
            <Text style={styles.paragraph}>
              Upon termination, your right to use the Services will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive termination.
            </Text>
          </View>
          
          <View style={styles.section} id="governing-law">
            <Text style={styles.sectionTitle}>11. Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </Text>
            <Text style={styles.paragraph}>
              Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located within the United States.
            </Text>
          </View>
          
          <View style={styles.section} id="contact">
            <Text style={styles.sectionTitle}>12. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms, please contact us at:
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
  importantText: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF4C4C',
    padding: 12,
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
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

export default TermsScreen;
