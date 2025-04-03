// src/screens/tools/GRCScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  FlatList,
  Modal,
  StatusBar as RNStatusBar,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { streamGRCQuestion } from '../../api/grcService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Category options for the modal
const CATEGORY_OPTIONS = [
  { label: 'Regulation', value: 'Regulation' },
  { label: 'Risk Management', value: 'Risk Management' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Audit', value: 'Audit' },
  { label: 'Governance', value: 'Governance' },
  { label: 'Management', value: 'Management' },
  { label: 'Policy', value: 'Policy' },
  { label: 'Ethics', value: 'Ethics' },
  { label: 'Threat Assessment', value: 'Threat Assessment' },
  { label: 'Leadership', value: 'Leadership' },
  { label: 'Business Continuity', value: 'Business Continuity' },
  { label: 'Random', value: 'Random' },
];

// Difficulty "chips" data
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

const GRCScreen = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation for cards
  const [cardAnims] = useState([...Array(20)].map(() => new Animated.Value(0)));
  
  // States
  const [category, setCategory] = useState('Random');
  const [difficulty, setDifficulty] = useState('Easy');
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [fetchAttempts, setFetchAttempts] = useState(0); // Track fetch attempts for retries

  // Ref for scroll view
  const scrollViewRef = useRef(null);

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
        delay: 100 + (i * 70),
        useNativeDriver: true
      }).start();
    });
  }, []);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copiedToClipboard) {
      const timer = setTimeout(() => {
        setCopiedToClipboard(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedToClipboard]);

  // Get color for difficulty
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy':
        return theme.colors.success;
      case 'Medium': 
        return theme.colors.warning;
      case 'Hard':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Validate question data to ensure all required fields exist
  const validateQuestionData = (data) => {
    if (!data) return false;
    
    // Check required fields
    const hasQuestion = typeof data.question === 'string' && data.question.trim().length > 0;
    const hasOptions = Array.isArray(data.options) && data.options.length === 4;
    const hasCorrectAnswerIndex = typeof data.correct_answer_index !== 'undefined' && 
                                 (data.correct_answer_index === 0 || 
                                  data.correct_answer_index === 1 || 
                                  data.correct_answer_index === 2 || 
                                  data.correct_answer_index === 3);
    const hasExplanations = data.explanations && typeof data.explanations === 'object';
    
    // Check if we have at least the explanation for the correct answer
    const hasCorrectExplanation = hasExplanations && 
                                  typeof data.explanations[data.correct_answer_index.toString()] === 'string';
    
    // Require all core fields
    if (!hasQuestion || !hasOptions || !hasCorrectAnswerIndex || !hasExplanations || !hasCorrectExplanation) {
      console.warn("Question data validation failed:", {
        hasQuestion,
        hasOptions,
        hasCorrectAnswerIndex,
        hasExplanations,
        hasCorrectExplanation
      });
      return false;
    }
    
    return true;
  };

  // The main "fetch question" logic - now with better error handling and retries
  const fetchQuestion = async (retryAttempt = 0) => {
    setLoading(true);
    setQuestionData(null);
    setSelectedOption(null);
    setShowExplanation(false);
    setErrorMessage('');
    setFetchAttempts(retryAttempt);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Improved service call with fallback questions
      const data = await streamGRCQuestion(category, difficulty);
      
      // Additional validation to ensure the data is complete
      if (validateQuestionData(data)) {
        console.log('GRC Question received and validated successfully');
        setQuestionData(data);
      } else {
        // If validation fails and we haven't exceeded retry attempts
        if (retryAttempt < 2) {
          console.log(`Validation failed, retrying (attempt ${retryAttempt + 1}/2)...`);
          setLoading(false);
          fetchQuestion(retryAttempt + 1);
          return;
        } else {
          // After retries, use the data anyway (the service should provide fallbacks)
          console.log('Using data despite validation issues after retries');
          setQuestionData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setErrorMessage('Failed to load question. Please check your network connection.');
      
      // Don't show alert for retry attempts
      if (retryAttempt === 0) {
        Alert.alert('Error', 'Error fetching question. Retrying...', [{ text: 'OK' }]);
        
        // Auto-retry once
        setLoading(false);
        fetchQuestion(1);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const handleAnswer = (optionIndex) => {
    if (!questionData) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSelectedOption(optionIndex);
    const correctIndex = questionData.correct_answer_index;
    const isCorrect = optionIndex === correctIndex;

    setShowExplanation(true);

    // Extra haptic feedback based on correctness
    if (Platform.OS === 'ios') {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Copy entire question+explanation
  const handleCopy = async () => {
    if (!questionData || !showExplanation) return;

    try {
      const correctIndex = questionData.correct_answer_index;
      const correctExplanation = questionData.explanations[correctIndex.toString()];
      const examTip = questionData.exam_tip || "Remember key concepts from this question!";

      // Build multi-line text to copy
      const textToCopy = [
        `Question: ${questionData.question}`,
        "",
        "Options:",
        ...questionData.options.map((opt, i) => `${i + 1}. ${opt}`),
        "",
        `Correct Answer: ${questionData.options[correctIndex]}`,
        "",
        `Explanation: ${correctExplanation}`,
        "",
        `Exam Tip: ${examTip}`
      ].join('\n');

      await Clipboard.setStringAsync(textToCopy);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCopiedToClipboard(true);
      Alert.alert('Success', 'Copied to clipboard!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy text', [{ text: 'OK' }]);
    }
  };

  // Load a new question
  const getNewQuestion = () => {
    fetchQuestion();
  };

  // Returns letter label (A, B, C, D, etc.)
  const getLetterFromIndex = (index) => {
    return String.fromCharCode(65 + index);
  };

  // Handle selecting a category from the modal
  const handleCategorySelect = (value) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    setCategory(value);
    setShowCategoryModal(false);
  };

  // Render each category item in the modal list
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem, 
        { 
          borderBottomColor: theme.colors.border,
          backgroundColor: item.value === category ? 
            `${theme.colors.primary}20` : 'transparent',
        }
      ]}
      onPress={() => handleCategorySelect(item.value)}
    >
      <Text style={[styles.categoryItemText, { 
        color: theme.colors.text, 
        fontFamily: 'ShareTechMono' 
      }]}>
        {item.label}
      </Text>
      {item.value === category && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Get explanation text with default if missing
  const getExplanationText = (index) => {
    if (!questionData || !questionData.explanations) return "";
    
    const indexStr = index.toString();
    const correctIndex = questionData.correct_answer_index.toString();
    
    // If we have the specific explanation, use it
    if (questionData.explanations[indexStr]) {
      return questionData.explanations[indexStr];
    }
    
    // Otherwise generate a basic explanation
    if (index === questionData.correct_answer_index) {
      return `This is the correct answer. ${questionData.options[index]} is the right choice for this question.`;
    } else {
      return `This is incorrect. The correct answer is ${questionData.options[questionData.correct_answer_index]}.`;
    }
  };

  // Get exam tip with default if missing
  const getExamTip = () => {
    if (!questionData) return "";
    
    return questionData.exam_tip || 
           "Remember the key concepts and apply critical thinking when answering similar questions on the exam!";
  };

  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar style="light" />

      {/* Fixed back button in top left */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Main Header */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <LinearGradient
          colors={[theme.colors.primary + '30', theme.colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
            GRC <Text style={{ color: theme.colors.primary }}>WIZARD</Text>
          </Text>
          <View style={styles.headerSubtitleBox}>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              MASTER THE ART OF GOVERNANCE, RISK, AND COMPLIANCE
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ScrollView for entire content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
            <LinearGradient
              colors={['transparent', theme.colors.primary + '40', 'transparent']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={styles.sectionTitleGradient}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
              CONFIGURATION
            </Text>
          </View>
          
          <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="settings" size={22} color={theme.colors.buttonText} />
          </View>
        </View>
        
        {/* Card for generating a question */}
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
          <View style={[styles.wizardCard, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          }]}>
            <View style={styles.controls}>
              {/* Category selection */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                CATEGORY
              </Text>
              <TouchableOpacity
                style={[styles.categoryButton, { 
                  backgroundColor: theme.colors.inputBackground, 
                  borderColor: theme.colors.inputBorder 
                }]}
                onPress={() => !loading && setShowCategoryModal(true)}
                disabled={loading}
              >
                <Ionicons name="list" size={16} color={theme.colors.primary} />
                <Text style={[styles.categoryButtonText, { 
                  color: theme.colors.inputText,
                  fontFamily: 'ShareTechMono'
                }]}>
                  {category}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.inputText} />
              </TouchableOpacity>

              {/* Difficulty row of chips */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                DIFFICULTY
              </Text>
              <View style={styles.chipRow}>
                {DIFFICULTY_OPTIONS.map((diff) => {
                  const active = difficulty === diff;
                  const diffColor = getDifficultyColor(diff);
                  return (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.chip, 
                        {
                          backgroundColor: active ? diffColor : theme.colors.inputBackground,
                          borderColor: active ? diffColor : theme.colors.inputBorder
                        }
                      ]}
                      onPress={() => {
                        if (Platform.OS === 'ios' && !loading) {
                          Haptics.selectionAsync();
                        }
                        !loading && setDifficulty(diff);
                      }}
                      disabled={loading}
                    >
                      <Text 
                        style={[
                          styles.chipText, 
                          { 
                            color: active ? theme.colors.buttonText : theme.colors.textSecondary,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                      >
                        {diff.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton, 
                  { backgroundColor: theme.colors.buttonPrimary },
                  loading && { opacity: 0.7 }
                ]}
                onPress={fetchQuestion}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={theme.colors.buttonText} size="small" />
                    <Text style={[styles.buttonText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron'
                    }]}>
                      GENERATING
                    </Text>
                  </View>
                ) : questionData ? (
                  <View style={styles.buttonContent}>
                    <Ionicons name="sync" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron'
                    }]}>
                      NEW QUESTION
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="book" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron'
                    }]}>
                      GENERATE QUESTION
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Error message box */}
        {errorMessage ? (
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
            <View style={[
              styles.errorContainer, 
              { 
                backgroundColor: `${theme.colors.error}10`,
                borderColor: `${theme.colors.error}30`,
                borderLeftColor: theme.colors.error,
                borderLeftWidth: 4
              }
            ]}>
              <Ionicons name="warning" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { 
                color: theme.colors.error,
                fontFamily: 'ShareTechMono'
              }]}>
                {errorMessage}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Loading Card */}
        {loading && !questionData && (
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
            <View style={[
              styles.loadingCard,
              { 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              }
            ]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { 
                color: theme.colors.text,
                fontFamily: 'Orbitron-Bold'
              }]}>
                PREPARING YOUR QUESTION...
              </Text>
              <Text style={[styles.loadingSubtext, { 
                color: theme.colors.textMuted,
                fontFamily: 'ShareTechMono'
              }]}>
                THIS WILL ONLY TAKE A MOMENT, PLEASE WAIT.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* If question loaded, show it */}
        {questionData && (
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
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { 
                  color: theme.colors.text,
                  fontFamily: 'Orbitron-Bold'
                }]}>
                  GRC CHALLENGE
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.toolCard }]}>
                <Ionicons name="shield" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.questionCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              {/* Top info */}
              <View style={[styles.questionHeader, { backgroundColor: `${theme.colors.primary}20` }]}>
                <View style={styles.questionMeta}>
                  <View style={styles.categoryContainer}>
                    <Ionicons
                      name={category === 'Random' ? 'shuffle' : 'shield-checkmark'}
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={[styles.questionCategory, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      {category}
                    </Text>
                  </View>
                  <View style={styles.difficultyContainer}>
                    <Ionicons
                      name={
                        difficulty === 'Easy'
                          ? 'bulb-outline'
                          : difficulty === 'Medium'
                          ? 'rocket'
                          : 'trophy'
                      }
                      size={16}
                      color={getDifficultyColor(difficulty)}
                    />
                    <Text style={[
                      styles.questionDifficulty, 
                      { 
                        color: getDifficultyColor(difficulty),
                        fontFamily: 'ShareTechMono'
                      }
                    ]}>
                      {difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.questionTitle, { 
                  color: theme.colors.text,
                  fontFamily: 'Orbitron-Bold'
                }]}>
                  QUESTION
                </Text>
              </View>

              {/* The question itself */}
              <View style={styles.questionContent}>
                <Text style={[styles.questionText, { 
                  color: theme.colors.text,
                  fontFamily: 'ShareTechMono'
                }]}>
                  {questionData.question}
                </Text>

                <View style={styles.optionsContainer}>
                  {questionData.options &&
                    questionData.options.map((option, index) => {
                      const isCorrect = index === questionData.correct_answer_index;
                      const isSelected = selectedOption === index;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.option,
                            { 
                              backgroundColor: theme.colors.inputBackground,
                              borderColor: theme.colors.inputBorder
                            },
                            isSelected && { 
                              backgroundColor: `${theme.colors.primary}20`,
                              borderColor: theme.colors.primary
                            },
                            showExplanation && isCorrect && { 
                              backgroundColor: `${theme.colors.success}20`,
                              borderColor: theme.colors.success
                            },
                            showExplanation && isSelected && !isCorrect && { 
                              backgroundColor: `${theme.colors.error}20`,
                              borderColor: theme.colors.error
                            },
                          ]}
                          onPress={() => handleAnswer(index)}
                          disabled={selectedOption !== null}
                        >
                          <View
                            style={[
                              styles.optionLetter,
                              { backgroundColor: theme.colors.background },
                              showExplanation && isCorrect && { backgroundColor: theme.colors.success },
                              showExplanation && isSelected && !isCorrect && { backgroundColor: theme.colors.error },
                            ]}
                          >
                            <Text 
                              style={[
                                styles.optionLetterText, 
                                { 
                                  color: theme.colors.text,
                                  fontFamily: 'Orbitron-Bold'
                                },
                                (showExplanation && (isCorrect || (isSelected && !isCorrect))) && 
                                  { color: theme.colors.buttonText }
                              ]}
                            >
                              {getLetterFromIndex(index)}
                            </Text>
                          </View>
                          <Text style={[styles.optionText, { 
                            color: theme.colors.text,
                            fontFamily: 'ShareTechMono'
                          }]}>
                            {option}
                          </Text>
                          {showExplanation && isCorrect && (
                            <Ionicons name="checkmark" size={20} color={theme.colors.success} style={styles.statusIcon} />
                          )}
                          {showExplanation && isSelected && !isCorrect && (
                            <Ionicons name="close" size={20} color={theme.colors.error} style={styles.statusIcon} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>

              {/* If explanation is shown */}
              {showExplanation && selectedOption !== null && (
                <View style={[styles.explanationContainer, { 
                  backgroundColor: `${theme.colors.primary}10`, 
                  borderTopColor: theme.colors.border 
                }]}>
                  <View style={styles.explanationHeader}>
                    <View style={styles.explanationTitleContainer}>
                      {selectedOption === questionData.correct_answer_index ? (
                        <>
                          <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                          <Text style={[styles.explanationTitle, { 
                            color: theme.colors.text,
                            fontFamily: 'Orbitron-Bold'
                          }]}>
                            CORRECT
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="close" size={20} color={theme.colors.error} />
                          <Text style={[styles.explanationTitle, { 
                            color: theme.colors.text,
                            fontFamily: 'Orbitron-Bold'
                          }]}>
                            INCORRECT
                          </Text>
                        </>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.copyButton, 
                        { backgroundColor: copiedToClipboard ? theme.colors.success : theme.colors.buttonSecondary }
                      ]}
                      onPress={handleCopy}
                    >
                      {copiedToClipboard ? (
                        <View style={styles.copyButtonContent}>
                          <Ionicons name="checkmark" size={16} color={theme.colors.buttonText} />
                          <Text style={[styles.copyButtonText, { 
                            color: theme.colors.buttonText,
                            fontFamily: 'ShareTechMono'
                          }]}>
                            COPIED
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.copyButtonContent}>
                          <Ionicons name="copy" size={16} color={theme.colors.buttonText} />
                          <Text style={[styles.copyButtonText, { 
                            color: theme.colors.buttonText,
                            fontFamily: 'ShareTechMono'
                          }]}>
                            COPY
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.explanationContent}>
                    <View style={[styles.explanationSection, { 
                      backgroundColor: theme.colors.inputBackground, 
                      borderColor: theme.colors.inputBorder 
                    }]}>
                      <Text style={[styles.explanationSectionTitle, { 
                        color: theme.colors.text,
                        fontFamily: 'Orbitron-Bold'
                      }]}>
                        EXPLANATION
                      </Text>
                      <Text style={[styles.explanationText, { 
                        color: theme.colors.textSecondary,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        {getExplanationText(selectedOption)}
                      </Text>
                    </View>

                    <View style={[styles.explanationSection, { 
                      backgroundColor: theme.colors.inputBackground, 
                      borderColor: theme.colors.inputBorder 
                    }]}>
                      <View style={styles.tipTitleContainer}>
                        <Ionicons name="bulb" size={18} color={theme.colors.warning} />
                        <Text style={[styles.explanationSectionTitle, { 
                          color: theme.colors.text,
                          fontFamily: 'Orbitron-Bold'
                        }]}>
                          EXAM TIP
                        </Text>
                      </View>
                      <Text style={[styles.tipText, { 
                        color: theme.colors.textSecondary, 
                        borderLeftColor: theme.colors.warning,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        {getExamTip()}
                      </Text>
                    </View>
                  </View>

                  {/* "New Question" button */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.nextButton, { backgroundColor: theme.colors.buttonPrimary }]} 
                      onPress={getNewQuestion}
                    >
                      <Ionicons name="sync" size={20} color={theme.colors.buttonText} />
                      <Text style={[styles.nextButtonText, { 
                        color: theme.colors.buttonText,
                        fontFamily: 'Orbitron'
                      }]}>
                        NEW QUESTION
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Bottom spacer for better scrolling */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Scroll to top button */}
      <Animated.View
        style={[
          styles.scrollTopButton,
          { 
            backgroundColor: theme.colors.primary,
            opacity: scrollY.interpolate({
              inputRange: [50, 200],
              outputRange: [0, 1],
              extrapolate: 'clamp'
            }),
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [50, 200],
                outputRange: [80, 0],
                extrapolate: 'clamp'
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.scrollTopButtonTouchable}
          onPress={scrollToTop}
        >
          <Ionicons name="chevron-up" size={24} color={theme.colors.buttonText} />
        </TouchableOpacity>
      </Animated.View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.fullScreenModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalCenteredContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[
                styles.modalContent, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary,
                  borderWidth: 1
                }
              ]}>
                <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.modalTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    SELECT A CATEGORY
                  </Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={CATEGORY_OPTIONS}
                  keyExtractor={(item) => item.value}
                  renderItem={renderCategoryItem}
                  style={styles.categoryList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : RNStatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitleBox: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
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
  
  // Scroll to top button
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scrollTopButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
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
  
  // "Wizard card" for the top control area
  wizardCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
  controls: {
    gap: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Category selection button
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    flex: 1,
  },
  // Difficulty chips row
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  // Generate Button
  generateButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
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
  // Error box
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  // Loading card
  loadingCard: {
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    letterSpacing: 1,
  },
  loadingSubtext: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  // Question card
  questionCard: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  questionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionCategory: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionDifficulty: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  questionContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 25,
  },
  optionsContainer: {
    gap: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionLetterText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  statusIcon: {
    marginLeft: 10,
  },
  explanationContainer: {
    padding: 20,
    borderTopWidth: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  explanationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  explanationContent: {
    gap: 20,
  },
  explanationSection: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  tipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  explanationSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  actionButtons: {
    alignItems: 'center',
    marginTop: 25,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Category modal - updated for clicking outside
  fullScreenModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCenteredContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    width: '100%',
    maxHeight: '95%',
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  categoryList: {
    padding: 10,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItemText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 100, // Extra padding at bottom for scrolling
  },
});

export default GRCScreen;
