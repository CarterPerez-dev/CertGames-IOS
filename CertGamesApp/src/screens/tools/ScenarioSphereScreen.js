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
  StatusBar as RNStatusBar
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
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
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
      
      Alert.alert('Correct!', 'You selected the right answer.', [{ text: 'OK' }]);
    } else {
      // Haptic feedback for incorrect answer
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert('Incorrect', "That's not the right answer.", [{ text: 'OK' }]);
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
      <Text style={[styles.modalSuggestionText, { color: theme.colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          <Ionicons name="shield" size={24} color={theme.colors.primary} /> Scenario Sphere
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Immerse yourself in realistic cybersecurity scenarios and test your knowledge
        </Text>

        {errorMessage ? (
          <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20`, borderColor: `${theme.colors.error}40` }]}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMessage}</Text>
            <TouchableOpacity style={styles.errorCloseButton} onPress={() => setErrorMessage('')}>
              <Ionicons name="close" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        ref={scrollViewRef} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Param card */}
          <View style={[styles.paramsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.paramsHeader}>
              <View style={styles.paramsHeaderLeft}>
                <Ionicons name="settings" size={20} color={theme.colors.primary} />
                <Text style={[styles.paramsTitle, { color: theme.colors.text }]}>Generation Parameters</Text>
              </View>
              <View style={[styles.scoreCounter, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Text style={[styles.scoreValue, { color: theme.colors.text }]}>
                  <Text style={[styles.scoreHighlight, { color: theme.colors.primary }]}>{scoreCounter}</Text>/3
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Correct</Text>
              </View>
            </View>

            <View style={styles.paramsContent}>
              {/* Industry */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary }]}>
                  <Ionicons name="business" size={16} color={theme.colors.primary} /> Industry
                </Text>
                <TouchableOpacity
                  style={[styles.industryButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}
                  onPress={() => !isGenerating && setShowIndustryModal(true)}
                  disabled={isGenerating}
                >
                  <Ionicons name="list" size={16} color={theme.colors.primary} />
                  {/* Show actual `industry` */}
                  <Text style={[styles.industryButtonText, { color: theme.colors.inputText }]}>{industry}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.inputText} />
                </TouchableOpacity>
              </View>

              {/* Attack type */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary }]}>
                  <Ionicons name="skull" size={16} color={theme.colors.primary} /> Attack Type
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
                  <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.inputText }]}
                    placeholder="Search or enter attack type..."
                    placeholderTextColor={theme.colors.placeholder}
                    value={attackType}
                    onChangeText={handleAttackTypeChange}
                    editable={!isGenerating}
                  />
                </View>

                {showSuggestions && suggestions.length > 0 && (
                  <View style={[styles.suggestionsPreview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    {suggestions.slice(0, 3).map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={[styles.suggestionPreviewItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => selectSuggestion(sug)}
                      >
                        <Text style={[styles.suggestionPreviewText, { color: theme.colors.text }]}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                    {suggestions.length > 3 && (
                      <TouchableOpacity 
                        style={[styles.showAllButton, { backgroundColor: `${theme.colors.primary}20` }]} 
                        onPress={handleShowAllSuggestions}
                      >
                        <Text style={[styles.showAllText, { color: theme.colors.primary }]}>
                          Show all ({suggestions.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Skill level chips */}
              <View style={styles.paramGroup}>
                <Text style={[styles.paramLabel, { color: theme.colors.textSecondary }]}>
                  <Ionicons name="person" size={16} color={theme.colors.primary} /> Attacker Skill Level
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
                            { color: active ? theme.colors.buttonText : theme.colors.textSecondary }
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Threat Intensity Slider */}
              <View style={styles.paramGroup}>
                <View style={styles.sliderLabelContainer}>
                  <Text style={[styles.paramLabel, { color: theme.colors.textSecondary }]}>
                    <Ionicons name="thermometer" size={16} color={theme.colors.primary} /> Threat Intensity
                  </Text>
                  <View style={[styles.intensityBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.intensityValue, { color: theme.colors.buttonText }]}>{threatIntensity}</Text>
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
                  <Text style={[styles.sliderMarker, { color: theme.colors.textSecondary }]}>Low</Text>
                  <Text style={[styles.sliderMarker, { color: theme.colors.textSecondary }]}>Medium</Text>
                  <Text style={[styles.sliderMarker, { color: theme.colors.textSecondary }]}>High</Text>
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
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generating...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="play" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generate Scenario</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* If scenario was generated */}
          {scenarioGenerated && (
            <View style={styles.results}>
              {/* Scenario Output */}
              <View style={[styles.outputCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity style={styles.outputHeader} onPress={() => setOutputExpanded(!outputExpanded)}>
                  <View style={styles.outputHeaderLeft}>
                    <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
                    <Text style={[styles.outputTitle, { color: theme.colors.text }]}>Generated Scenario</Text>
                  </View>

                  <View style={styles.outputControls}>
                    {!generationComplete && isGenerating && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.progressTrack }]}>
                          <View style={[styles.progressFill, { width: `${streamProgress}%`, backgroundColor: theme.colors.primary }]} />
                        </View>
                        <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Generating...</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.toggleButton}>
                      <Ionicons
                        name={outputExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {outputExpanded && (
                  <ScrollView
                    style={styles.outputContent}
                    ref={scenarioOutputRef}
                    contentContainerStyle={styles.outputContentContainer}
                  >
                    {scenarioText ? (
                      <Text style={[styles.scenarioText, { color: theme.colors.text }]}>
                        {scenarioText}
                        {isGenerating && <Text style={[styles.cursor, { color: theme.colors.primary }]}>|</Text>}
                      </Text>
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <ActivityIndicator color={theme.colors.primary} size="large" animating={isGenerating} />
                        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                          Scenario will appear here...
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Assessment Card */}
              {interactiveQuestions.length > 0 && (
                <View style={[styles.questionsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <TouchableOpacity
                    style={styles.questionsHeader}
                    onPress={() => setQuestionsExpanded(!questionsExpanded)}
                  >
                    <View style={styles.questionsHeaderLeft}>
                      <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
                      <Text style={[styles.questionsTitle, { color: theme.colors.text }]}>Knowledge Assessment</Text>
                    </View>
                    <TouchableOpacity style={styles.toggleButton}>
                      <Ionicons
                        name={questionsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {questionsExpanded && (
                    <View style={styles.questionsContent}>
                      {/* If user has answered all */}
                      {Object.keys(feedback).length === interactiveQuestions.length && (
                        <View style={[styles.assessmentComplete, { backgroundColor: `${theme.colors.success}10`, borderColor: `${theme.colors.success}30` }]}>
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                          <View style={styles.assessmentResults}>
                            <Text style={[styles.completionMessage, { color: theme.colors.text }]}>Assessment Complete</Text>
                            <Text style={[styles.scoreMessage, { color: theme.colors.textSecondary }]}>
                              You scored {scoreCounter} out of {interactiveQuestions.length} correct
                            </Text>
                          </View>
                        </View>
                      )}

                      {interactiveQuestions.map((question, index) => {
                        const questionFeedback = feedback[index];
                        const isCorrect = questionFeedback?.isCorrect;

                        return (
                          <View key={index} style={[styles.questionCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <View style={styles.questionHeader}>
                              <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>Question {index + 1}</Text>
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
                                      { color: isCorrect ? theme.colors.success : theme.colors.error }
                                    ]}
                                  >
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text style={[styles.questionText, { color: theme.colors.text }]}>{question.question}</Text>

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
                                            { color: theme.colors.text },
                                            (showCorrect || showIncorrect) && { color: theme.colors.buttonText }
                                          ]}
                                        >
                                          {optionLetter}
                                        </Text>
                                      </View>

                                      <Text style={[styles.optionText, { color: theme.colors.text }]}>{optionText}</Text>

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
                              <View style={[styles.feedbackContainer, { backgroundColor: `${theme.colors.warning}10`, borderColor: `${theme.colors.warning}30` }]}>
                                <Ionicons name="bulb" size={20} color={theme.colors.warning} style={styles.feedbackIcon} />
                                <Text style={[styles.feedbackExplanation, { color: theme.colors.text }]}>
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
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Industry Modal */}
      <Modal
        visible={showIndustryModal}
        // Not transparent, so user sees a real full-screen modal with a background
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowIndustryModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalHeaderTitle, { color: theme.colors.text }]}>Select an Industry</Text>
            <TouchableOpacity onPress={() => setShowIndustryModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={INDUSTRY_OPTIONS}
            keyExtractor={(item) => item.value}
            style={styles.flatList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.industryItem, 
                  { 
                    borderBottomColor: theme.colors.border,
                    backgroundColor: item.value === industry ? `${theme.colors.primary}20` : 'transparent'
                  }
                ]}
                onPress={() => handleSelectIndustry(item.value)}
              >
                <Text style={[styles.industryItemText, { color: theme.colors.text }]}>{item.label}</Text>
                {item.value === industry && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Attack type "Show all suggestions" Modal */}
      <Modal
        visible={showSuggestionsModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalHeaderTitle, { color: theme.colors.text }]}>Attack Types</Text>
            <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            style={styles.flatList}
            renderItem={renderSuggestionItem}
          />
        </SafeAreaView>
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
    borderRadius: 15,
    margin: 15,
    marginBottom: 10,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    borderTopWidth: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
    paddingTop: 0,
    paddingBottom: 30,
  },
  paramsCard: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  paramsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paramsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  scoreHighlight: {
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
  },
  paramsContent: {
    padding: 15,
  },
  paramGroup: {
    marginBottom: 15,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  industryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  industryButtonText: {
    fontSize: 16,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
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
  },
  showAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  },
  generateButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
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
  },
  results: {
    gap: 20,
  },
  outputCard: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
  outputHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outputHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputContent: {
    padding: 15,
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
  },
  questionsCard: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  questionsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionsContent: {
    padding: 15,
  },
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
  },
  scoreMessage: {
    fontSize: 14,
  },
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
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
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
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  flatList: {
    flex: 1,
  },
  industryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  industryItemText: {
    fontSize: 16,
  },
  modalSuggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalSuggestionText: {
    fontSize: 16,
  },
});

export default ScenarioSphereScreen;
