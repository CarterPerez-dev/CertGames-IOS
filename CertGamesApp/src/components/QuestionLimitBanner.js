// src/components/QuestionLimitBanner.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const QuestionLimitBanner = () => {
  const { subscriptionActive, practiceQuestionsRemaining } = useSelector(state => state.user);
  const navigation = useNavigation();
  
  // Don't show for premium users
  if (subscriptionActive) {
    return null;
  }
  
  // Enforce at least 0 (never negative)
  const questionsLeft = Math.max(0, practiceQuestionsRemaining || 0);
  
  // Calculate progress - cap at 100%
  const progress = Math.min(100, (questionsLeft / 100) * 100);
  
  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={22} color="#6543CC" />
        <View style={styles.textContainer}>
          <Text style={styles.countText}>
            <Text style={styles.countNumber}>{questionsLeft}</Text> free questions remaining
          </Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('SubscriptionIOS')}
      >
        <Text style={styles.upgradeText}>Upgrade</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.2)',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
  },
  countText: {
    color: '#6543CC',
    fontSize: 14,
    fontWeight: '500',
  },
  countNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(101, 67, 204, 0.2)',
    borderRadius: 2,
    marginTop: 4,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6543CC',
    borderRadius: 2,
  },
  upgradeButton: {
    backgroundColor: '#6543CC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default QuestionLimitBanner;
