// src/screens/tools/ScenarioSphereScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Keyboard,
  Alert,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  Animated
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { streamScenario, streamScenarioQuestions } from '../../api/scenarioService';
import { ATTACK_TYPES } from './attackTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Industry list for the modal
const INDUSTRY_OPTIONS = [
  { label: 'Finance', value: 'Finance' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Energy', value: 'Energy' },
  { label: 'Education', value: 'Education' },
  { label: 'Supply Chain', value: 'Supply Chain' },
  { label: 'Telecommunications', value: 'Telecommunications' },
  { label: 'Pharmaceutical', value: 'Pharmaceutical' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Cybersecurity Company', value: 'Cybersecurity Company' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'CYBERPUNK2077', value: 'CYBERPUNK2077' },
];

const SKILL_LEVELS = ['Script Kiddie', 'Intermediate', 'Advanced', 'APT'];

const ScenarioSphereScreen = () => {
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
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Industry
  const [industry, setIndustry] = useState('Finance');
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  // Attack type input
  const [attackType, setAttackType] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Skill level
  const [skillLevel, setSkillLevel] = useState('Script Kiddie');

  // Threat intensity
  const [threatIntensity, setThreatIntensity] = useState(50);

  // Scenario + questions
  const [scenarioText, setScenarioText] = useState('');
  const [interactiveQuestions, setInteractiveQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  // UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [scoreCounter, setScoreCounter] = useState(0);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [scenarioGenerated, setScenarioGenerated] = useState(false);

  // Refs for scrolling
  const scrollViewRef = useRef();
  const scenarioOutputRef = useRef();

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
  
  // Auto-scroll scenario output
  useEffect(() => {
    if (scenarioText && scenarioOutputRef.current && isGenerating) {
      scenarioOutputRef.current.scrollToEnd({ animated: true });
    }
  }, [scenarioText, isGenerating]);

  /////////////////////////////////////////////////////////////////////////////
  // Attack type
  const handleAttackTypeChange = (text) => {
    setAttackType(text);
    setErrorMessage('');

    if (text.length > 0) {
      const filtered = ATTACK_TYPES.filter((attack) =>
        attack.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (sug) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    setAttackType(sug);
    setShowSuggestions(false);
    setShowSuggestionsModal(false);
  };

  const handleShowAllSuggestions = () => {
    setShowSuggestionsModal(true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Industry
  const handleSelectIndustry = (value) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    setIndustry(value);
    setShowIndustryModal(false);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Generate scenario
  const handleGenerateScenario = async () => {
    if (!attackType.trim()) {
      setErrorMessage('Please enter the Type of Attack');
      Alert.alert('Missing Information', 'Please enter the Type of Attack', [{ text: 'OK' }]);
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setErrorMessage('');
    setIsGenerating(true);
    setScenarioText('');
    setInteractiveQuestions([]);
    setUserAnswers({});
    setFeedback({});
    setScoreCounter(0);
    setScenarioGenerated(true);
    setGenerationComplete(false);

    try {
      // 1) scenario
      const scenarioData = await streamScenario(industry, attackType, skillLevel, threatIntensity);
      setScenarioText(scenarioData);
      setGenerationComplete(true);

      // 2) questions
      fetchQuestions(scenarioData);
    } catch (error) {
      console.error('Error generating scenario:', error);
      setErrorMessage('An error occurred while generating the scenario');
      Alert.alert('Error', 'Error generating scenario. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchQuestions = async (finalScenarioText) => {
    if (!finalScenarioText) return;

    try {
      const questionsData = await streamScenarioQuestions(finalScenarioText);
      if (Array.isArray(questionsData)) {
        const errorObj = questionsData.find((q) => q.error);
        if (errorObj) {
          console.error('Error in questions generation:', errorObj.error);
          setErrorMessage(`Error generating questions: ${errorObj.error}`);
          Alert.alert('Error', `Error generating questions: ${errorObj.error}`, [{ text: 'OK' }]);
        } else if (questionsData.length === 3) {
          setInteractiveQuestions(questionsData);
        } else {
          console.error('Expected exactly 3 questions, but got', questionsData);
          setErrorMessage('Unexpected number of questions received');
        }
      } else {
        console.error('Questions data not an array.');
        setErrorMessage('Invalid format for interactive questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setErrorMessage('Error fetching questions');
      Alert.alert('Error', 'Error fetching questions. Please try again.', [{ text: 'OK' }]);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Answer selection
  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (Object.prototype.hasOwnProperty.call(userAnswers, questionIndex)) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const question = interactiveQuestions[questionIndex];
    if (!question) return;

    const isCorrect = selectedOption === question.correct_answer;
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
    setFeedback((prev) => ({
      ...prev,
      [questionIndex]: {
        isCorrect,
        explanation: question.explanation,
      },
    }));

    if (isCorrect) {
      setScoreCounter((prev) => prev + 1);
      
      // Haptic feedback for correct answer
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Haptic feedback for incorrect answer
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Progress
  const calculateStreamProgress = () => {
    if (!scenarioText) return 0;
    const paragraphs = scenarioText.split('\n\n').filter((p) => p.trim().length > 0);
    return Math.min(Math.ceil((paragraphs.length / 5) * 100), 90);
  };
  const streamProgress = calculateStreamProgress();

  // Render suggestion
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.modalSuggestionItem, 
        { borderBottomColor: theme.colors.border }
      ]} 
      onPress={() => selectSuggestion(item)}
    >
      <Text style={[styles.modalSuggestionText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>{item}</Text>
    </TouchableOpacity>
  );

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

      <ScrollView 
        style={styles.scrollView} 
        ref={scrollViewRef} 
        contentContainerStyle={styles.scrollViewContent} 
        keyboardShouldPersistTaps="handled"
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
                <Text style={{ color: theme.colors.primary }}>SCENARIO</Text> SPHERE
              </Text>
              <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                CYBERSECURITY SCENARIOS
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Error message if any */}
        {errorMessage ? (
          <View style={[styles.errorContainer, { 
            backgroundColor: `${theme.colors.error}20`, 
            borderColor: `${theme.colors.error}40`,
            marginHorizontal: 15
          }]}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error, fontFamily: 'ShareTechMono' }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity style={styles.errorCloseButton} onPress={() => setErrorMessage('')}>
              <Ionicons name="close" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Parameters Card */}
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
                PARAMETERS
              </Text>
            </View>
            
            <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="settings" size={22} color={theme.colors.buttonText} />
            </View>
          </View>
          
          <View style={[styles.paramsCard, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            marginHorizontal: 15
          }]}>
            <View style={styles.paramsHeaderRow}>
              <View style={styles.paramsHeaderLeft}>
                <Ionicons name="shield" size={20} color={theme.colors.primary} />
                <Text style={[styles.paramsHeaderTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  PARAMETERS
                </Text>
              </View>
              <View style={[styles.scoreCounter, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Text style={[styles.scoreValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  <Text style={[styles.scoreHighlight, { color: theme.colors.primary }]}>{scoreCounter}</Text>/3
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  CORRECT
                </Text>
              </View>
            </View>

            <View style={styles.paramsContent}>
              {/* Industry */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  <Ionicons name="business" size={16} color={theme.colors.primary} /> INDUSTRY
                </Text>
                <TouchableOpacity
                  style={[styles.industryButton, { 
                    backgroundColor: theme.colors.inputBackground, 
                    borderColor: theme.colors.inputBorder 
                  }]}
                  onPress={() => !isGenerating && setShowIndustryModal(true)}
                  disabled={isGenerating}
                >
                  <Ionicons name="list" size={16} color={theme.colors.primary} />
                  <Text style={[styles.industryButtonText, { 
                    color: theme.colors.inputText,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    {industry}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.inputText} />
                </TouchableOpacity>
              </View>

              {/* Attack type */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  <Ionicons name="skull" size={16} color={theme.colors.primary} /> ATTACK TYPE
                </Text>
                <View style={[styles.inputWrapper, { 
                  backgroundColor: theme.colors.inputBackground, 
                  borderColor: theme.colors.inputBorder 
                }]}>
                  <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { 
                      color: theme.colors.inputText,
                      fontFamily: 'ShareTechMono'
                    }]}
                    placeholder="Enter attack type"
                    placeholderTextColor={theme.colors.placeholder}
                    value={attackType}
                    onChangeText={handleAttackTypeChange}
                    editable={!isGenerating}
                  />
                </View>

                {showSuggestions && suggestions.length > 0 && (
                  <View style={[styles.suggestionsPreview, { 
                    backgroundColor: theme.colors.surface, 
                    borderColor: theme.colors.border 
                  }]}>
                    {suggestions.slice(0, 3).map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={[styles.suggestionPreviewItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => selectSuggestion(sug)}
                      >
                        <Text style={[styles.suggestionPreviewText, { 
                          color: theme.colors.text,
                          fontFamily: 'ShareTechMono'
                        }]}>
                          {sug}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {suggestions.length > 3 && (
                      <TouchableOpacity 
                        style={[styles.showAllButton, { backgroundColor: `${theme.colors.primary}20` }]} 
                        onPress={handleShowAllSuggestions}
                      >
                        <Text style={[styles.showAllText, { 
                          color: theme.colors.primary,
                          fontFamily: 'ShareTechMono'
                        }]}>
                          SHOW ALL ({suggestions.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Skill level chips */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  <Ionicons name="person" size={16} color={theme.colors.primary} /> ATTACKER SKILL LEVEL
                </Text>
                <View style={styles.chipRow}>
                  {SKILL_LEVELS.map((level) => {
                    const active = skillLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.chip, 
                          { 
                            backgroundColor: active ? theme.colors.primary : theme.colors.inputBackground,
                            borderColor: active ? theme.colors.primary : theme.colors.inputBorder
                          }
                        ]}
                        onPress={() => {
                          if (Platform.OS === 'ios' && !isGenerating) {
                            Haptics.selectionAsync();
                          }
                          !isGenerating && setSkillLevel(level);
                        }}
                        disabled={isGenerating}
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
                          {level.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Threat Intensity Slider */}
              <View style={styles.paramGroup}>
                <View style={styles.sliderLabelContainer}>
                  <Text style={[styles.paramLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                    <Ionicons name="thermometer" size={16} color={theme.colors.primary} /> THREAT INTENSITY
                  </Text>
                  <View style={[styles.intensityBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.intensityValue, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      {threatIntensity}
                    </Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={threatIntensity}
                  onValueChange={(val) => setThreatIntensity(val)}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.inputBorder}
                  thumbTintColor={theme.colors.primary}
                  disabled={isGenerating}
                />
                <View style={styles.sliderMarkers}>
                  <Text style={[styles.sliderMarker, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    LOW
                  </Text>
                  <Text style={[styles.sliderMarker, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    MEDIUM
                  </Text>
                  <Text style={[styles.sliderMarker, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    HIGH
                  </Text>
                </View>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton, 
                  { backgroundColor: theme.colors.buttonPrimary },
                  isGenerating && styles.generateButtonDisabled
                ]}
                onPress={handleGenerateScenario}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={theme.colors.buttonText} size="small" />
                    <Text style={[styles.buttonText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      GENERATING...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="play" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { 
                      color: theme.colors.buttonText,
                      fontFamily: 'Orbitron-Bold'
                    }]}>
                      GENERATE SCENARIO
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* If scenario was generated */}
        {scenarioGenerated && (
          <View style={styles.results}>
            {/* Scenario Output */}
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
                    GENERATED SCENARIO
                  </Text>
                </View>
                
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.toolCard }]}>
                  <Ionicons name="document-text" size={22} color={theme.colors.buttonText} />
                </View>
              </View>
              
              <View style={[styles.outputCard, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                marginHorizontal: 15
              }]}>
                <TouchableOpacity 
                  style={styles.outputHeader} 
                  onPress={() => setOutputExpanded(!outputExpanded)}
                >
                  <LinearGradient
                    colors={[theme.colors.toolCard, theme.colors.toolCard + '80']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.outputHeaderGradient}
                  >
                    <View style={styles.outputHeaderLeft}>
                      <Ionicons name="lock-closed" size={20} color={theme.colors.buttonText} />
                      <Text style={[styles.outputTitle, { 
                        color: theme.colors.buttonText,
                        fontFamily: 'Orbitron-Bold'
                      }]}>
                        SCENARIO NARRATIVE
                      </Text>
                    </View>

                    <View style={styles.outputControls}>
                      {!generationComplete && isGenerating && (
                        <View style={styles.progressContainer}>
                          <View style={[styles.progressBar, { backgroundColor: theme.colors.progressTrack }]}>
                            <View style={[styles.progressFill, { 
                              width: `${streamProgress}%`, 
                              backgroundColor: theme.colors.primary 
                            }]} />
                          </View>
                          <Text style={[styles.progressLabel, { 
                            color: theme.colors.buttonText,
                            fontFamily: 'ShareTechMono'
                          }]}>
                            GENERATING...
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.toggleButton}>
                        <Ionicons
                          name={outputExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={theme.colors.buttonText}
                        />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {outputExpanded && (
                  <ScrollView
                    style={styles.outputContent}
                    ref={scenarioOutputRef}
                    contentContainerStyle={styles.outputContentContainer}
                  >
                    {scenarioText ? (
                      <Text style={[styles.scenarioText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                        {scenarioText}
                        {isGenerating && <Text style={[styles.cursor, { color: theme.colors.primary }]}>|</Text>}
                      </Text>
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <ActivityIndicator color={theme.colors.primary} size="large" animating={isGenerating} />
                        <Text style={[styles.placeholderText, { 
                          color: theme.colors.textSecondary,
                          fontFamily: 'ShareTechMono'
                        }]}>
                          SCENARIO WILL APPEAR HERE...
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </Animated.View>

            {/* Assessment Card */}
            {interactiveQuestions.length > 0 && (
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
                  <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <LinearGradient
                      colors={['transparent', theme.colors.secondary + '40', 'transparent']}
                      start={{x: 0, y: 0.5}}
                      end={{x: 1, y: 0.5}}
                      style={styles.sectionTitleGradient}
                    />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                      KNOWLEDGE ASSESSMENT
                    </Text>
                  </View>
                  
                  <View style={[styles.sectionIcon, { backgroundColor: theme.colors.secondary }]}>
                    <Ionicons name="help-circle" size={22} color={theme.colors.buttonText} />
                  </View>
                </View>
                
                <View style={[styles.questionsCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                  marginHorizontal: 15
                }]}>
                  <TouchableOpacity
                    style={styles.questionsHeader}
                    onPress={() => setQuestionsExpanded(!questionsExpanded)}
                  >
                    <LinearGradient
                      colors={[theme.colors.secondary, theme.colors.secondary + '80']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.questionsHeaderGradient}
                    >
                      <View style={styles.questionsHeaderLeft}>
                        <Ionicons name="help-circle" size={20} color={theme.colors.buttonText} />
                        <Text style={[styles.questionsTitle, { 
                          color: theme.colors.buttonText,
                          fontFamily: 'Orbitron-Bold'
                        }]}>
                          INTERACTIVE ASSESSMENT
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.toggleButton}>
                        <Ionicons
                          name={questionsExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={theme.colors.buttonText}
                        />
                      </TouchableOpacity>
                    </LinearGradient>
                  </TouchableOpacity>

                  {questionsExpanded && (
                    <View style={styles.questionsContent}>
                      {/* If user has answered all */}
                      {Object.keys(feedback).length === interactiveQuestions.length && (
                        <View style={[styles.assessmentComplete, { 
                          backgroundColor: `${theme.colors.success}10`, 
                          borderColor: `${theme.colors.success}30` 
                        }]}>
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                          <View style={styles.assessmentResults}>
                            <Text style={[styles.completionMessage, { 
                              color: theme.colors.text,
                              fontFamily: 'Orbitron-Bold'
                            }]}>
                              ASSESSMENT COMPLETE
                            </Text>
                            <Text style={[styles.scoreMessage, { 
                              color: theme.colors.textSecondary,
                              fontFamily: 'ShareTechMono'
                            }]}>
                              YOU SCORED {scoreCounter} OUT OF {interactiveQuestions.length} CORRECT
                            </Text>
                          </View>
                        </View>
                      )}

                      {interactiveQuestions.map((question, index) => {
                        const questionFeedback = feedback[index];
                        const isCorrect = questionFeedback?.isCorrect;

                        return (
                          <View key={index} style={[styles.questionCard, { 
                            backgroundColor: theme.colors.background, 
                            borderColor: theme.colors.border 
                          }]}>
                            <View style={styles.questionHeader}>
                              <Text style={[styles.questionNumber, { 
                                color: theme.colors.primary,
                                fontFamily: 'Orbitron-Bold'
                              }]}>
                                QUESTION {index + 1}
                              </Text>
                              {questionFeedback && (
                                <View
                                  style={[
                                    styles.questionStatus,
                                    { 
                                      backgroundColor: isCorrect ? 
                                        `${theme.colors.success}20` : 
                                        `${theme.colors.error}20` 
                                    }
                                  ]}
                                >
                                  <Ionicons
                                    name={isCorrect ? 'checkmark' : 'close'}
                                    size={16}
                                    color={isCorrect ? theme.colors.success : theme.colors.error}
                                  />
                                  <Text
                                    style={[
                                      styles.statusText, 
                                      { 
                                        color: isCorrect ? theme.colors.success : theme.colors.error,
                                        fontFamily: 'ShareTechMono'
                                      }
                                    ]}
                                  >
                                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text style={[styles.questionText, { 
                              color: theme.colors.text,
                              fontFamily: 'ShareTechMono'
                            }]}>
                              {question.question}
                            </Text>

                            <View style={styles.optionsContainer}>
                              {question.options &&
                                Object.entries(question.options).map(([optionLetter, optionText]) => {
                                  const isSelected = userAnswers[index] === optionLetter;
                                  const showCorrect = questionFeedback && question.correct_answer === optionLetter;
                                  const showIncorrect = questionFeedback && isSelected && !isCorrect;

                                  return (
                                    <TouchableOpacity
                                      key={optionLetter}
                                      style={[
                                        styles.optionButton,
                                        { 
                                          backgroundColor: theme.colors.inputBackground,
                                          borderColor: theme.colors.inputBorder
                                        },
                                        isSelected && { 
                                          backgroundColor: `${theme.colors.primary}20`,
                                          borderColor: theme.colors.primary
                                        },
                                        showCorrect && { 
                                          backgroundColor: `${theme.colors.success}20`,
                                          borderColor: theme.colors.success
                                        },
                                        showIncorrect && { 
                                          backgroundColor: `${theme.colors.error}20`,
                                          borderColor: theme.colors.error
                                        },
                                      ]}
                                      onPress={() => handleAnswerSelect(index, optionLetter)}
                                      disabled={Object.prototype.hasOwnProperty.call(userAnswers, index)}
                                    >
                                      <View
                                        style={[
                                          styles.optionLetter,
                                          { backgroundColor: theme.colors.background },
                                          showCorrect && { backgroundColor: theme.colors.success },
                                          showIncorrect && { backgroundColor: theme.colors.error },
                                        ]}
                                      >
                                        <Text 
                                          style={[
                                            styles.optionLetterText, 
                                            { 
                                              color: theme.colors.text,
                                              fontFamily: 'Orbitron-Bold'
                                            },
                                            (showCorrect || showIncorrect) && { color: theme.colors.buttonText }
                                          ]}
                                        >
                                          {optionLetter}
                                        </Text>
                                      </View>

                                      <Text style={[styles.optionText, { 
                                        color: theme.colors.text,
                                        fontFamily: 'ShareTechMono'
                                      }]}>
                                        {optionText}
                                      </Text>

                                      {showCorrect && (
                                        <Ionicons name="checkmark" size={20} color={theme.colors.success} style={styles.optionIcon} />
                                      )}
                                      {showIncorrect && (
                                        <Ionicons name="close" size={20} color={theme.colors.error} style={styles.optionIcon} />
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                            </View>

                            {questionFeedback && (
                              <View style={[styles.feedbackContainer, { 
                                backgroundColor: `${theme.colors.warning}10`, 
                                borderColor: `${theme.colors.warning}30` 
                              }]}>
                                <Ionicons name="bulb" size={20} color={theme.colors.warning} style={styles.feedbackIcon} />
                                <Text style={[styles.feedbackExplanation, { 
                                  color: theme.colors.text,
                                  fontFamily: 'ShareTechMono'
                                }]}>
                                  {questionFeedback.explanation}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        )}
        
        {/* Tip card when no scenario is generated yet */}
        {!scenarioGenerated && !isGenerating && (
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
            <View style={[styles.tipCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              marginHorizontal: 15
            }]}>
              <LinearGradient
                colors={[theme.colors.secondary, theme.colors.secondary + '80']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.tipHeader}
              >
                <Ionicons name="bulb" size={20} color={theme.colors.buttonText} />
                <Text style={[styles.tipTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                  USAGE TIPS
                </Text>
              </LinearGradient>
              
              <View style={styles.tipContent}>
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    INDUSTRY SELECTION
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    CHOOSE THE INDUSTRY SECTOR THAT BEST MATCHES YOUR INTERESTS OR PROFESSIONAL DOMAIN
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    ATTACK TYPES
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    ENTER A SPECIFIC ATTACK VECTOR LIKE RANSOMWARE, PHISHING, SUPPLY CHAIN ATTACK, OR INSIDER THREAT
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    SKILL LEVELS
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    ADJUST ATTACKER SKILL LEVEL FROM BASIC (SCRIPT KIDDIE) TO HIGHLY ADVANCED (APT)
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.warning,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.warning,
                    fontFamily: 'Orbitron'
                  }]}>
                    THREAT INTENSITY
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    CONTROL THE SEVERITY AND IMPACT LEVEL OF THE CYBER THREAT WITH THE INTENSITY SLIDER
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Industry Modal */}
      <Modal
        visible={showIndustryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIndustryModal(false)}
      >
        <TouchableOpacity 
          style={styles.fullScreenModalOverlay}
          activeOpacity={1}
          onPress={() => setShowIndustryModal(false)}
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
                  borderColor: theme.colors.border
                }
              ]}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.modalHeader}
                >
                  <Text style={[styles.modalTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    SELECT AN INDUSTRY
                  </Text>
                  <TouchableOpacity onPress={() => setShowIndustryModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </LinearGradient>

                <FlatList
                  data={INDUSTRY_OPTIONS}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.industryItem, 
                        { 
                          borderBottomColor: theme.colors.border,
                          backgroundColor: item.value === industry ? 
                            `${theme.colors.primary}20` : 'transparent'
                        }
                      ]}
                      onPress={() => handleSelectIndustry(item.value)}
                    >
                      <Text style={[styles.industryItemText, { 
                        color: theme.colors.text,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        {item.label}
                      </Text>
                      {item.value === industry && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.modalList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Attack type "Show all suggestions" Modal */}
      <Modal
        visible={showSuggestionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.fullScreenModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestionsModal(false)}
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
                  borderColor: theme.colors.border
                }
              ]}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.modalHeader}
                >
                  <Text style={[styles.modalTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    ATTACK TYPES
                  </Text>
                  <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </LinearGradient>

                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item}
                  renderItem={renderSuggestionItem}
                  style={styles.modalList}
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

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 30,
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
  // Error message
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  errorCloseButton: {
    padding: 5,
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
  // Parameters card
  paramsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  paramsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  paramsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paramsHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreCounter: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreHighlight: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  paramsContent: {
    padding: 20,
  },
  paramGroup: {
    marginBottom: 20,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Industry button
  industryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  industryButtonText: {
    fontSize: 16,
    flex: 1,
    letterSpacing: 0.5,
  },
  // Input field
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  // Suggestions
  suggestionsPreview: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    overflow: 'hidden',
  },
  suggestionPreviewItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionPreviewText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  showAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Chip row
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Threat intensity slider
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  intensityValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMarker: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  // Generate button
  generateButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    opacity: 0.7,
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
  // Results section
  results: {
    gap: 20,
  },
  // Output card
  outputCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  outputHeader: {
    width: '100%',
  },
  outputHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  outputHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  outputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    width: 100,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputContent: {
    padding: 20,
    maxHeight: 300,
  },
  outputContentContainer: {
    minHeight: 100,
  },
  scenarioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  cursor: {
    fontWeight: 'bold',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 15,
  },
  placeholderText: {
    fontSize: 16,
    letterSpacing: 0.5,
    marginTop: 15,
  },
  // Questions card
  questionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  questionsHeader: {
    width: '100%',
  },
  questionsHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  questionsContent: {
    padding: 20,
  },
  // Assessment complete
  assessmentComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    gap: 15,
  },
  assessmentResults: {
    flex: 1,
  },
  completionMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  scoreMessage: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  // Question card
  questionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  // Options container
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  optionIcon: {
    marginLeft: 10,
  },
  // Feedback container
  feedbackContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    gap: 12,
  },
  feedbackIcon: {
    marginTop: 2,
  },
  feedbackExplanation: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  // Tip card
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  tipItemTitle: {
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
  // Modal
  // Modal styles
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
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '95%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalList: {
    padding: 8,
    maxHeight: height * 0.6,
  },
  industryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  industryItemText: {
    fontSize: 16,
  },
  modalSuggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalSuggestionText: {
    fontSize: 16,
  },
  // Bottom padding
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
});

export default ScenarioSphereScreen;
