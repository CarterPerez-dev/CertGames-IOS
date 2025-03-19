// src/components/TestProgressComponent.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import testService from '../api/testService';

/**
 * Component to display progress for a test category
 * 
 * @param {Object} props - Component props
 * @param {string} props.category - The test category to show progress for
 * @returns {JSX.Element|null} - The progress component or null if no data
 */
const TestProgressComponent = ({ category }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useSelector(state => state.user);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!userId || !category) return;
      
      try {
        setLoading(true);
        // Get all attempts for the user
        const attempts = await testService.listTestAttempts(userId);
        
        // Filter attempts for this category
        const categoryAttempts = attempts.attempts.filter(a => a.category === category);
        
        // Count finished attempts by testId
        const finishedTests = new Set();
        categoryAttempts.forEach(attempt => {
          if (attempt.finished) {
            finishedTests.add(attempt.testId);
          }
        });
        
        // Calculate percentages
        const testsCompleted = finishedTests.size;
        const totalTests = 10; // Most categories have 10 tests
        const percentComplete = Math.round((testsCompleted / totalTests) * 100);
        
        setProgress({
          completed: testsCompleted,
          total: totalTests,
          percent: percentComplete
        });
      } catch (err) {
        console.error('Error fetching test progress:', err);
        // Create a fallback progress object
        setProgress({
          completed: 0,
          total: 10,
          percent: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, [userId, category]);
  
  // Don't render if still loading or no progress data
  if (loading || !progress) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>
        {progress.completed}/{progress.total} Tests Completed ({progress.percent}%)
      </Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress.percent}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6543CC',
    borderRadius: 3,
  }
});

export default TestProgressComponent;
