// src/screens/tools/XploitCraftScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { useToast } from 'react-native-toast-notifications';
import { generatePayload } from '../../api/xploitService';

const XploitCraftScreen = () => {
  const [vulnerability, setVulnerability] = useState('');
  const [evasionTechnique, setEvasionTechnique] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState(null);
  
  const scrollViewRef = useRef();
  const toast = useToast();

  const handleGeneratePayload = async () => {
    if (!vulnerability.trim()) {
      toast.show('Please enter a vulnerability', {
        type: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setGeneratedPayload(null);

    try {
      const result = await generatePayload(vulnerability, evasionTechnique, true);
      
      // Parse the result if it's in a usable format
      if (typeof result === 'string') {
        // If the API just returns a string
        setGeneratedPayload({
          code_examples: [
            { 
              title: 'Payload', 
              code: result 
            }
          ],
          explanations: [
            {
              title: 'Explanation',
              content: 'Payload generated successfully.'
            }
          ]
        });
      } else if (typeof result === 'object') {
        // If the API returns a structured object
        setGeneratedPayload(result);
      }
      
      // Scroll to bottom to show results
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
      
    } catch (error) {
      console.error('Error generating payload:', error);
      toast.show('Error generating payload. Please try again.', {
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.show('Copied to clipboard!', {
        type: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.show('Failed to copy to clipboard', {
        type: 'danger',
        duration: 3000,
      });
    }
  };

  const copyAllToClipboard = async () => {
    if (!generatedPayload) return;
    
    try {
      let allText = '';
      
      // Add code examples
      if (generatedPayload.code_examples && generatedPayload.code_examples.length > 0) {
        generatedPayload.code_examples.forEach(example => {
          allText += `### ${example.title} ###\n\n${example.code}\n\n`;
        });
      }
      
      // Add explanations
      if (generatedPayload.explanations && generatedPayload.explanations.length > 0) {
        generatedPayload.explanations.forEach(explanation => {
          allText += `### ${explanation.title} ###\n\n${explanation.content}\n\n`;
        });
      }
      
      await Clipboard.setStringAsync(allText);
      toast.show('All content copied to clipboard!', {
        type: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy all:', error);
      toast.show('Failed to copy content', {
        type: 'danger',
        duration: 3000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Logo and Title */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>XploitCraft</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Vulnerability or Exploit"
            placeholderTextColor="#888"
            value={vulnerability}
            onChangeText={setVulnerability}
            editable={!isLoading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Enter Evasion Technique or Delivery Method"
            placeholderTextColor="#888"
            value={evasionTechnique}
            onChangeText={setEvasionTechnique}
            editable={!isLoading}
          />
        </View>
        
        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
            onPress={handleGeneratePayload}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Generating...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Generate Payload</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Results Container */}
        {generatedPayload && (
          <View style={styles.resultsContainer}>
            {/* Code Examples Section */}
            {generatedPayload.code_examples && generatedPayload.code_examples.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Code Examples</Text>
                
                {generatedPayload.code_examples.map((example, index) => (
                  <View key={`code-${index}`} style={styles.codeBlock}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeTitle}>{example.title}</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(example.code)}
                      >
                        <Ionicons name="copy-outline" size={16} color="#fff" />
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.codeContent}>
                      <Text style={styles.codeText}>{example.code}</Text>
                    </ScrollView>
                  </View>
                ))}
              </View>
            )}
            
            {/* Explanations Section */}
            {generatedPayload.explanations && generatedPayload.explanations.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Explanations</Text>
                
                {generatedPayload.explanations.map((explanation, index) => (
                  <View key={`exp-${index}`} style={styles.explanationBlock}>
                    <Text style={styles.explanationTitle}>{explanation.title}</Text>
                    <Text style={styles.explanationText}>{explanation.content}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Copy All Button */}
            <TouchableOpacity
              style={styles.copyAllButton}
              onPress={copyAllToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyAllText}>Copy All Content</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomWidth: 3,
    borderBottomColor: '#660000',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  inputContainer: {
    gap: 15,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    borderWidth: 2,
    borderColor: '#660000',
    borderRadius: 10,
    color: '#fff',
    padding: 15,
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#660000',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
    minWidth: 200,
  },
  generateButtonDisabled: {
    backgroundColor: '#330000',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resultsContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#660000',
    padding: 20,
    gap: 20,
  },
  sectionContainer: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 0, 0.3)',
    paddingBottom: 5,
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  codeHeader: {
    backgroundColor: 'rgba(102, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 5,
  },
  copyText: {
    fontSize: 12,
    color: '#fff',
  },
  codeContent: {
    padding: 15,
    maxHeight: 250,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#e0e0e0',
  },
  explanationBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6666',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 0, 0.2)',
    paddingBottom: 5,
  },
  explanationText: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#660000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#000',
    alignSelf: 'center',
    marginTop: 10,
    gap: 10,
  },
  copyAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default XploitCraftScreen;
