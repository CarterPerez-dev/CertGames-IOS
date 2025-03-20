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
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [explanations, setExplanations] = useState([]);
  
  const scrollViewRef = useRef();
  const toast = useToast();

  const parsePayload = (text) => {
    const codeRegex = /Example \d+:?\s*```python([\s\S]*?)```/g;
    const extractedCode = [];
    let match;
    
    // Extract all code blocks
    while ((match = codeRegex.exec(text)) !== null) {
      const codeIndex = extractedCode.length + 1;
      extractedCode.push({
        title: `Example ${codeIndex}`,
        code: match[1].trim()
      });
    }
    
    // Extract explanations section
    let explanationsText = "";
    const explanationsIndex = text.indexOf("EXPLANATIONS:");
    if (explanationsIndex !== -1) {
      explanationsText = text.substring(explanationsIndex);
    } else {
      // If there's no explicit "EXPLANATIONS:", try after the last code block
      const lastCodeEnd = text.lastIndexOf("```");
      if (lastCodeEnd !== -1) {
        explanationsText = text.substring(lastCodeEnd + 3).trim();
      }
    }
    
    // Extract individual explanations
    const explanationBlocks = [];
    if (explanationsText) {
      const explRegex = /Explanation for Example \d+:?\s*([\s\S]*?)(?=Explanation for Example \d+:|$)/g;
      let explMatch;
      
      while ((explMatch = explRegex.exec(explanationsText)) !== null) {
        explanationBlocks.push({
          text: explMatch[1].trim()
        });
      }
      
      if (explanationBlocks.length === 0 && explanationsText) {
        explanationBlocks.push({
          text: explanationsText.replace("EXPLANATIONS:", "").trim()
        });
      }
    }
    
    setCodeBlocks(extractedCode);
    setExplanations(explanationBlocks);
  };

  const handleGeneratePayload = async () => {
    if (!vulnerability.trim() && !evasionTechnique.trim()) {
      toast.show('Please enter at least one of vulnerability or evasion technique', {
        type: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setGeneratedPayload(null);
    setCodeBlocks([]);
    setExplanations([]);

    try {
      const result = await generatePayload(vulnerability, evasionTechnique, true);
      
      setGeneratedPayload(result);
      parsePayload(result);
      
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

  const handleCopyClick = async (text) => {
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
      await Clipboard.setStringAsync(generatedPayload);
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
        {codeBlocks.length > 0 || explanations.length > 0 ? (
          <View style={styles.resultsContainer}>
            {/* Code Examples Section */}
            {codeBlocks.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Code Examples</Text>
                
                {codeBlocks.map((block, index) => (
                  <View key={`code-${index}`} style={styles.codeBlock}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeTitle}>{block.title}</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyClick(block.code)}
                      >
                        <Ionicons name="copy-outline" size={16} color="#fff" />
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.codeContent}>
                      <Text style={styles.codeText}>{block.code}</Text>
                    </ScrollView>
                  </View>
                ))}
              </View>
            )}
            
            {/* Explanations Section */}
            {explanations.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Explanations</Text>
                
                {explanations.map((explanation, index) => (
                  <View key={`exp-${index}`} style={styles.explanationBlock}>
                    <Text style={styles.explanationTitle}>
                      {explanations.length > 1 ? `Explanation for Example ${index + 1}` : 'Explanation'}
                    </Text>
                    <Text style={styles.explanationText}>
                      {explanation.text.split('\n').map((paragraph, pIndex) => (
                        <Text key={pIndex}>{paragraph}{'\n\n'}</Text>
                      ))}
                    </Text>
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
        ) : generatedPayload ? (
          <View style={styles.resultsContainer}>
            <View style={styles.explanationBlock}>
              <Text style={styles.explanationText}>{generatedPayload}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.copyAllButton}
              onPress={copyAllToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyAllText}>Copy All Content</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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

