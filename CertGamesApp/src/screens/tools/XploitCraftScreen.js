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
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { generatePayload } from '../../api/xploitService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const XploitCraftScreen = () => {
  const navigation = useNavigation();
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState([...Array(5)].map(() => new Animated.Value(0)));

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

  // Animation on mount
  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Staggered card animations
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (i * 120),
        useNativeDriver: true
      }).start();
    });
  }, []);

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
      
      {/* Fixed back button in top right */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header Section with Title */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent']}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 1}}
              style={styles.headerBackground}
            >
              <View style={styles.headerContent}>
                <Text style={[styles.mainTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  <Text style={{ color: theme.colors.primary }}>XPLOIT</Text>CRAFT
                </Text>
                <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  GENERATE PAYLOADS FOR LEARNING
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Input Parameters Card */}
          <Animated.View
            style={{
              opacity: cardAnims[0],
              transform: [{
                translateY: cardAnims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  INPUT PARAMETERS
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="code-slash" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.card, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow
            }]}>
              {/* Input Fields */}
              <View style={styles.cardContent}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    VULNERABILITY OR EXPLOIT:
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.inputText,
                        borderColor: theme.colors.inputBorder,
                        fontFamily: 'ShareTechMono'
                      }
                    ]}
                    placeholder="E.g. SQL Injection, XSS, Buffer Overflow..."
                    placeholderTextColor={theme.colors.placeholder}
                    value={vulnerability}
                    onChangeText={setVulnerability}
                    editable={!isLoading}
                  />
                  
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    EVASION TECHNIQUE OR DELIVERY METHOD:
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.inputText,
                        borderColor: theme.colors.inputBorder,
                        fontFamily: 'ShareTechMono'
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
                      <Text style={[styles.buttonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                        GENERATING...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="flash" size={20} color={theme.colors.buttonText} />
                      <Text style={[styles.buttonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                        GENERATE PAYLOAD
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          
          {/* Results Container */}
          {(codeBlocks.length > 0 || explanations.length > 0 || generatedPayload) && (
            <Animated.View
              style={{
                opacity: cardAnims[1],
                transform: [{
                  translateY: cardAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.toolCard + '20' }]}>
                  <LinearGradient
                    colors={['transparent', theme.colors.toolCard + '40', 'transparent']}
                    start={{x: 0, y: 0.5}}
                    end={{x: 1, y: 0.5}}
                    style={styles.sectionTitleGradient}
                  />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                    GENERATED PAYLOAD
                  </Text>
                </View>
                
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.toolCard }]}>
                  <Ionicons name="document-text" size={22} color={theme.colors.buttonText} />
                </View>
              </View>
            
              <View style={[styles.resultsCard, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={[theme.colors.toolCard, theme.colors.toolCard + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.resultsTitleRow}
                >
                  <View style={styles.resultsTitleContainer}>
                    <Ionicons name="code-download" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.resultsTitle, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      PAYLOAD
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.copyAllButton, 
                      { 
                        backgroundColor: copySuccess ? 
                          theme.colors.success : 
                          'rgba(0, 0, 0, 0.3)' 
                      }
                    ]}
                    onPress={copyAllToClipboard}
                  >
                    <Ionicons 
                      name={copySuccess ? "checkmark-outline" : "copy-outline"} 
                      size={16} 
                      color={theme.colors.buttonText} 
                    />
                    <Text style={[styles.copyAllText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      {copySuccess ? "COPIED" : "COPY ALL"}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
                
                {/* Tab Buttons */}
                {(codeBlocks.length > 0 && explanations.length > 0) && (
                  <View style={styles.tabButtons}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        { borderColor: theme.colors.border },
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
                          { 
                            color: activeTab === 'code' ? theme.colors.buttonText : theme.colors.text,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                      >
                        CODE
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        { borderColor: theme.colors.border },
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
                          { 
                            color: activeTab === 'explanation' ? theme.colors.buttonText : theme.colors.text,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                      >
                        EXPLANATIONS
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
                        <LinearGradient
                          colors={[theme.colors.primary, theme.colors.primary + '80']}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={styles.codeHeader}
                        >
                          <Text style={[styles.codeTitle, { 
                            color: theme.colors.buttonText,
                            fontFamily: 'Orbitron-Bold'
                          }]}>
                            {block.title}
                          </Text>
                          <TouchableOpacity
                            style={[styles.copyButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                            onPress={() => handleCopyClick(block.code)}
                          >
                            <Ionicons name="copy-outline" size={16} color={theme.colors.buttonText} />
                            <Text style={[styles.copyText, { 
                              color: theme.colors.buttonText,
                              fontFamily: 'ShareTechMono'
                            }]}>
                              COPY
                            </Text>
                          </TouchableOpacity>
                        </LinearGradient>
                        <ScrollView style={styles.codeContent}>
                          <Text style={[styles.codeText, { 
                            color: theme.colors.text,
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
                          }]}>
                            {block.code}
                          </Text>
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
                        <Text style={[styles.explanationTitle, { 
                          color: theme.colors.primary,
                          fontFamily: 'Orbitron-Bold'
                        }]}>
                          {explanations.length > 1 ? `EXPLANATION FOR EXAMPLE ${index + 1}` : 'EXPLANATION'}
                        </Text>
                        <Text style={[styles.explanationText, { 
                          color: theme.colors.text,
                          fontFamily: 'ShareTechMono'
                        }]}>
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
                    <Text style={[styles.explanationText, { 
                      color: theme.colors.text,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      {generatedPayload}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
          
          {/* Loading Placeholder */}
          {isLoading && !generatedPayload && (
            <Animated.View
              style={{
                opacity: cardAnims[2],
                transform: [{
                  translateY: cardAnims[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={[
                styles.loadingContainer,
                { backgroundColor: theme.colors.surface }
              ]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { 
                  color: theme.colors.textSecondary,
                  fontFamily: 'Orbitron'
                }]}>
                  GENERATING SECURITY PAYLOAD...
                </Text>
                <Text style={[styles.loadingSubtext, { 
                  color: theme.colors.textMuted,
                  fontFamily: 'ShareTechMono'
                }]}>
                  THIS MAY TAKE A MOMENT, PLEASE WAIT.
                </Text>
              </View>
            </Animated.View>
          )}
          
          {/* Tip card when no payload is generated yet */}
          {!generatedPayload && !isLoading && (
            <Animated.View
              style={{
                opacity: cardAnims[2],
                transform: [{
                  translateY: cardAnims[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={[styles.tipCard, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.secondary + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="bulb" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                    USAGE TIPS
                  </Text>
                </LinearGradient>
                
                <View style={styles.tipContent}>
                  <View style={[styles.tipItem, { 
                    backgroundColor: theme.colors.surfaceHighlight,
                    borderLeftColor: theme.colors.primary,
                    borderColor: theme.colors.border
                  }]}>
                    <Text style={[styles.tipTitle, { 
                      color: theme.colors.text,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      VULNERABILITIES
                    </Text>
                    <Text style={[styles.tipText, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      SPECIFY THE VULNERABILITY TYPE TO TARGET (E.G., SQL INJECTION, XSS, BUFFER OVERFLOW, PATH TRAVERSAL)
                    </Text>
                  </View>
                  
                  <View style={[styles.tipItem, { 
                    backgroundColor: theme.colors.surfaceHighlight,
                    borderLeftColor: theme.colors.primary,
                    borderColor: theme.colors.border
                  }]}>
                    <Text style={[styles.tipTitle, { 
                      color: theme.colors.text,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      EVASION TECHNIQUES
                    </Text>
                    <Text style={[styles.tipText, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      OPTIONALLY SPECIFY EVASION METHODS (OBFUSCATION, ENCODING, POLYGLOT PAYLOADS) TO BYPASS SECURITY CONTROLS
                    </Text>
                  </View>
                  
                  <View style={[styles.tipItem, { 
                    backgroundColor: theme.colors.surfaceHighlight,
                    borderLeftColor: theme.colors.warning,
                    borderColor: theme.colors.border
                  }]}>
                    <Text style={[styles.tipTitle, { 
                      color: theme.colors.warning,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      ETHICAL WARNING
                    </Text>
                    <Text style={[styles.tipText, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      ONLY USE GENERATED PAYLOADS FOR AUTHORIZED SECURITY TESTING AND EDUCATIONAL PURPOSES
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  // Header with title
  headerContainer: {
    width: '100%',
    height: 150,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 25,
  },
  // Back button
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionTitleBg: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionTitleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cards
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 15,
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
    padding: 15,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  // Input section
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
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
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Results card
  resultsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 16,
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
    padding: 15,
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  copyAllText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Tabs
  tabButtons: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'center',
    gap: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Section containers
  sectionContainer: {
    padding: 16,
  },
  // Code block
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
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 5,
  },
  copyText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  codeContent: {
    padding: 16,
    maxHeight: 250,
  },
  codeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Explanation blocks
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
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Raw output
  rawOutputBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  // Loading container
  loadingContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Tip card
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  tipContent: {
    padding: 16,
    gap: 12,
  },
  tipItem: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  // Bottom padding
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
});

export default XploitCraftScreen;
