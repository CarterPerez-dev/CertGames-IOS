// src/components/PremiumFeaturePrompt.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const PremiumFeaturePrompt = ({ feature }) => {
  const navigation = useNavigation();
  
  const getFeatureInfo = () => {
    switch (feature) {
      case 'premium':
        return {
          title: 'Premium Feature',
          message: 'This feature is only available with a premium subscription.',
          icon: 'lock-closed'
        };
      case 'questions':
        return {
          title: 'Question Limit Reached',
          message: 'You\'ve used all of your free practice questions.',
          icon: 'alert-circle'
        };
      case 'daily':
        return {
          title: 'Premium Feature',
          message: 'Answering daily questions is only available with a premium subscription.',
          icon: 'lock-closed'
        };
      case 'resources':
        return {
          title: 'Premium Feature',
          message: 'Accessing resource links is only available with a premium subscription.',
          icon: 'lock-closed'
        };
      default:
        return {
          title: 'Premium Feature',
          message: 'This feature requires a premium subscription.',
          icon: 'lock-closed'
        };
    }
  };
  
  const { title, message, icon } = getFeatureInfo();
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0b0c15', '#121225']}
        style={styles.background}
      />
      
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#6543CC', '#8A58FC']}
            style={styles.iconGradient}
          >
            <Ionicons name={icon} size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>With Premium You Get:</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.checkIcon} />
            <Text style={styles.featureText}>Unlimited practice questions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.checkIcon} />
            <Text style={styles.featureText}>Access to all premium tools</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.checkIcon} />
            <Text style={styles.featureText}>Daily question answering</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.checkIcon} />
            <Text style={styles.featureText}>Full access to resources</Text>
          </View>
        </View>
        
        <View style={styles.trialInfo}>
          <Ionicons name="information-circle" size={20} color="#6543CC" style={styles.infoIcon} />
          <Text style={styles.trialText}>Start with a 3-day free trial - cancel anytime</Text>
        </View>
        
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('SubscriptionIOS')}
        >
          <LinearGradient
            colors={['#6543CC', '#8A58FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Upgrade to Premium</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: '#1A1A2A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  infoIcon: {
    marginRight: 10,
  },
  trialText: {
    fontSize: 14,
    color: '#AAAAAA',
    flex: 1,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#6543CC',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PremiumFeaturePrompt;
