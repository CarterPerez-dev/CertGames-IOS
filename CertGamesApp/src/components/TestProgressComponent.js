// src/components/TestProgressComponent.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { testService } from '../api/testService';

const TestProgressComponent = ({ category }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useSelector(state => state.user);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const attempts = await testService.listTestAttempts(userId);
        
        // Filter attempts for this category
        const categoryAttempts = attempts.attempts.filter(a => a.category === category);
        
        // Calculate completion percentage
        const testsCompleted = new Set(categoryAttempts
          .filter(a => a.finished)
          .map(a => a.testId)).size;
          
        const totalTests = 10; // Most categories have 10 tests
        const percentComplete = Math.round((testsCompleted / totalTests) * 100);
        
        setProgress({
          completed: testsCompleted,
          total: totalTests,
          percent: percentComplete
        });
      } catch (err) {
        console.error('Error fetching test progress:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, [userId, category]);
  
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
    marginVertical: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
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
