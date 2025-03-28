// src/components/ErrorBoundaryScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

class ErrorBoundaryScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Screen render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    const { screenName } = this.props;
    
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.errorTitle}>Error in {screenName || 'Screen'}</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.toString() || 'An unexpected error occurred'}
            </Text>
            
            {this.state.errorInfo && (
              <View style={styles.stackTraceContainer}>
                <Text style={styles.stackTraceTitle}>Error Details:</Text>
                <Text style={styles.stackTrace}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                if (this.props.navigation?.canGoBack()) {
                  this.props.navigation.goBack();
                }
              }}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4C8B',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  stackTraceContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  stackTraceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  stackTrace: {
    fontSize: 12,
    color: '#AAAAAA',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#6543CC',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorBoundaryScreen;
