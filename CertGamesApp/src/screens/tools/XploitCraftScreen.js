// src/screens/tools/XploitCraftScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { generatePayload } from '../../api/xploitService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const { width, height } = Dimensions.get('window');

const XploitCraftScreen = () => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  // State variables
  const [vulnerability, setVulnerability] = useState('');
  const [evasionTechnique, setEvasionTechnique] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState(null);
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'explanation'
  const [copySuccess, setCopySuccess] = useState(false);
  
  const scrollViewRef = useRef();

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

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
      Alert.alert('Error', 'Please enter at least one of vulnerability or evasion technique');
      return;
    }

    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Alert.alert('Error', 'Error generating payload. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClick = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCopySuccess(true);
      Alert.alert('Success', 'Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const copyAllToClipboard = async () => {
    if (!generatedPayload) return;
    
    try {
      await Clipboard.setStringAsync(generatedPayload);
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCopySuccess(true);
      Alert.alert('Success', 'All content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy all:', error);
      Alert.alert('Error', 'Failed to copy content');
    }
  };

  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <ExpoStatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              <Ionicons name="code-slash" size={28} color={theme.colors.primary} /> XploitCraft
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Generate payloads for security testing
            </Text>
          </View>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Input Parameters Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Input Parameters</Text>
            </View>
            
            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Vulnerability or Exploit:</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.inputText,
                    borderColor: theme.colors.inputBorder 
                  }
                ]}
                placeholder="E.g. SQL Injection, XSS, Buffer Overflow..."
                placeholderTextColor={theme.colors.placeholder}
                value={vulnerability}
                onChangeText={setVulnerability}
                editable={!isLoading}
              />
              
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Evasion Technique or Delivery Method:</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.inputText,
                    borderColor: theme.colors.inputBorder 
                  }
                ]}
                placeholder="E.g. Obfuscation, Encoding, Polyglot..."
                placeholderTextColor={theme.colors.placeholder}
                value={evasionTechnique}
                onChangeText={setEvasionTechnique}
                editable={!isLoading}
              />
            </View>
            
            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton, 
                { backgroundColor: theme.colors.buttonPrimary },
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleGeneratePayload}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={theme.colors.buttonText} size="small" />
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generating...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="flash" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generate Payload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Results Container */}
          {(codeBlocks.length > 0 || explanations.length > 0 || generatedPayload) && (
            <View style={[styles.resultsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.resultsTitleRow}>
                <View style={styles.resultsTitleContainer}>
                  <Ionicons name="code-download" size={22} color={theme.colors.primary} />
                  <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Payload</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.copyAllButton, 
                    { 
                      backgroundColor: copySuccess ? 
                        theme.colors.success : 
                        theme.colors.buttonSecondary 
                    }
                  ]}
                  onPress={copyAllToClipboard}
                >
                  <Ionicons 
                    name={copySuccess ? "checkmark-outline" : "copy-outline"} 
                    size={16} 
                    color={theme.colors.buttonText} 
                  />
                  <Text style={[styles.copyAllText, { color: theme.colors.buttonText }]}>
                    {copySuccess ? "Copied" : "Copy All"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Tab Buttons */}
              {(codeBlocks.length > 0 && explanations.length > 0) && (
                <View style={styles.tabButtons}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'code' && { 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary
                      }
                    ]}
                    onPress={() => setActiveTab('code')}
                  >
                    <Ionicons 
                      name="code-slash" 
                      size={18} 
                      color={activeTab === 'code' ? theme.colors.buttonText : theme.colors.text} 
                    />
                    <Text 
                      style={[
                        styles.tabButtonText, 
                        { color: activeTab === 'code' ? theme.colors.buttonText : theme.colors.text }
                      ]}
                    >
                      Code Examples
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'explanation' && { 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary
                      }
                    ]}
                    onPress={() => setActiveTab('explanation')}
                  >
                    <Ionicons 
                      name="document-text" 
                      size={18} 
                      color={activeTab === 'explanation' ? theme.colors.buttonText : theme.colors.text} 
                    />
                    <Text 
                      style={[
                        styles.tabButtonText, 
                        { color: activeTab === 'explanation' ? theme.colors.buttonText : theme.colors.text }
                      ]}
                    >
                      Explanations
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Code Blocks */}
              {(activeTab === 'code' || !explanations.length) && codeBlocks.length > 0 && (
                <View style={styles.sectionContainer}>
                  {codeBlocks.map((block, index) => (
                    <View key={`code-${index}`} style={[
                      styles.codeBlock,
                      { 
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
                      }
                    ]}>
                      <View style={[styles.codeHeader, { backgroundColor: theme.colors.primary }]}>
                        <Text style={[styles.codeTitle, { color: theme.colors.buttonText }]}>
                          {block.title}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                          onPress={() => handleCopyClick(block.code)}
                        >
                          <Ionicons name="copy-outline" size={16} color={theme.colors.buttonText} />
                          <Text style={[styles.copyText, { color: theme.colors.buttonText }]}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.codeContent}>
                        <Text style={[styles.codeText, { color: theme.colors.text }]}>{block.code}</Text>
                      </ScrollView>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Explanations */}
              {(activeTab === 'explanation' || !codeBlocks.length) && explanations.length > 0 && (
                <View style={styles.sectionContainer}>
                  {explanations.map((explanation, index) => (
                    <View key={`exp-${index}`} style={[
                      styles.explanationBlock,
                      { 
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
                      }
                    ]}>
                      <Text style={[styles.explanationTitle, { color: theme.colors.primary }]}>
                        {explanations.length > 1 ? `Explanation for Example ${index + 1}` : 'Explanation'}
                      </Text>
                      <Text style={[styles.explanationText, { color: theme.colors.text }]}>
                        {explanation.text.split('\n').map((paragraph, pIndex) => (
                          <Text key={pIndex}>{paragraph}{'\n\n'}</Text>
                        ))}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Raw Output Fallback */}
              {!codeBlocks.length && !explanations.length && generatedPayload && (
                <View style={[
                  styles.rawOutputBlock,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  }
                ]}>
                  <Text style={[styles.explanationText, { color: theme.colors.text }]}>{generatedPayload}</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Loading Placeholder */}
          {isLoading && !generatedPayload && (
            <View style={[
              styles.loadingContainer,
              { backgroundColor: theme.colors.surface }
            ]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Generating security payload...
              </Text>
              <Text style={[styles.loadingSubtext, { color: theme.colors.textMuted }]}>
                This may take a moment, please wait.
              </Text>
            </View>
          )}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  generateButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  tabButtons: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionContainer: {
    padding: 16,
  },
  codeBlock: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  codeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 12,
    marginLeft: 4,
  },
  codeContent: {
    padding: 16,
    maxHeight: 250,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  explanationBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  rawOutputBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
});

export default XploitCraftScreen;
