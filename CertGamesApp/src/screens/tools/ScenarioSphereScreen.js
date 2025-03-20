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
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { streamScenario, streamScenarioQuestions } from '../../api/scenarioService';
import { ATTACK_TYPES } from './attackTypes'

////////////////////////////////////////////////////////////////////////////////
// The possible industries for the "Industry" modal
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

// The skill-level “chips”
const SKILL_LEVELS = ['Script Kiddie', 'Intermediate', 'Advanced', 'APT'];

// Attack suggestions

const ScenarioSphereScreen = () => {
  // State for whether we’re generating
  const [isGenerating, setIsGenerating] = useState(false);

  // Industry selection
  const [industry, setIndustry] = useState('Finance');
  // Whether to show the industry modal
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  // Attack type input + suggestions
  const [attackType, setAttackType] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Skill level
  const [skillLevel, setSkillLevel] = useState('Script Kiddie');

  // Threat intensity
  const [threatIntensity, setThreatIntensity] = useState(50);

  // Scenario data
  const [scenarioText, setScenarioText] = useState('');
  const [interactiveQuestions, setInteractiveQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  // Additional states
  const [errorMessage, setErrorMessage] = useState('');
  const [scoreCounter, setScoreCounter] = useState(0);

  // UI toggles
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [scenarioGenerated, setScenarioGenerated] = useState(false);

  // Refs for scrolling
  const scrollViewRef = useRef();
  const scenarioOutputRef = useRef();

  // Auto-scroll scenario output while generating
  useEffect(() => {
    if (scenarioText && scenarioOutputRef.current && isGenerating) {
      scenarioOutputRef.current.scrollToEnd({ animated: true });
    }
  }, [scenarioText, isGenerating]);

  /////////////////////////////////////////////////////////////////////////////
  // Attack type input + suggestion logic
  const handleAttackTypeChange = (text) => {
    setAttackType(text);
    setErrorMessage('');

    if (text.length > 0) {
      const filteredSuggestions = ATTACK_TYPES.filter((attack) =>
        attack.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setAttackType(suggestion);
    setShowSuggestions(false);
    setShowSuggestionsModal(false);
  };

  const handleOutsideSuggestionPress = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleShowAllSuggestions = () => {
    setShowSuggestionsModal(true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Industry selection
  const handleSelectIndustry = (value) => {
    setIndustry(value);
    setShowIndustryModal(false);
  };

  // Skill-level “chips”
  const renderSkillLevelChips = () => (
    <View style={styles.chipRow}>
      {SKILL_LEVELS.map((level) => {
        const active = skillLevel === level;
        return (
          <TouchableOpacity
            key={level}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => !isGenerating && setSkillLevel(level)}
            disabled={isGenerating}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{level}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /////////////////////////////////////////////////////////////////////////////
  // Generation logic
  const handleGenerateScenario = async () => {
    if (!attackType.trim()) {
      setErrorMessage('Please enter the Type of Attack');
      Alert.alert('Missing Information', 'Please enter the Type of Attack', [{ text: 'OK' }]);
      return;
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
      // 1) Generate scenario
      const scenarioData = await streamScenario(industry, attackType, skillLevel, threatIntensity);

      setScenarioText(scenarioData);
      setGenerationComplete(true);

      // 2) Then fetch questions for that scenario
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
          console.error('Expected exactly 3 questions, but received:', questionsData);
          setErrorMessage('Unexpected number of questions received');
        }
      } else {
        console.error('Parsed questions are not in an array format.');
        setErrorMessage('Invalid format for interactive questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setErrorMessage('Error fetching questions');
      Alert.alert('Error', 'Error fetching questions. Please try again.', [{ text: 'OK' }]);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Answer logic
  const handleAnswerSelect = (questionIndex, selectedOption) => {
    // Already answered? do nothing
    if (Object.prototype.hasOwnProperty.call(userAnswers, questionIndex)) {
      return;
    }

    const question = interactiveQuestions[questionIndex];
    if (!question) return;

    const isCorrect = selectedOption === question.correct_answer;

    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: selectedOption,
    }));

    setFeedback((prevFeedback) => ({
      ...prevFeedback,
      [questionIndex]: {
        isCorrect,
        explanation: question.explanation,
      },
    }));

    if (isCorrect) {
      setScoreCounter((prev) => prev + 1);
      Alert.alert('Correct!', 'You selected the right answer.', [{ text: 'OK' }]);
    } else {
      Alert.alert('Incorrect', "That's not the right answer.", [{ text: 'OK' }]);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Stream progress (just a visual effect)
  const calculateStreamProgress = () => {
    if (!scenarioText) return 0;
    const paragraphs = scenarioText.split('\n\n').filter((p) => p.trim().length > 0);
    return Math.min(Math.ceil((paragraphs.length / 5) * 100), 90);
  };
  const streamProgress = calculateStreamProgress();

  /////////////////////////////////////////////////////////////////////////////
  // Render suggestion items for the "Show all" modal
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity style={styles.modalSuggestionItem} onPress={() => selectSuggestion(item)}>
      <Text style={styles.modalSuggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  // The UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Ionicons name="shield" size={24} color="#6543cc" /> Scenario Sphere
        </Text>
        <Text style={styles.subtitle}>
          Immerse yourself in realistic cybersecurity scenarios and test your knowledge
        </Text>

        {/* Error alert at top if needed */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#ff4e4e" />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.errorCloseButton} onPress={() => setErrorMessage('')}>
              <Ionicons name="close" size={18} color="#9da8b9" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Screen scroll */}
      <ScrollView style={styles.scrollView} ref={scrollViewRef} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          {/* Card with param controls */}
          <View style={styles.paramsCard}>
            <View style={styles.paramsHeader}>
              <View style={styles.paramsHeaderLeft}>
                <Ionicons name="settings" size={20} color="#6543cc" />
                <Text style={styles.paramsTitle}>Generation Parameters</Text>
              </View>

              <View style={styles.scoreCounter}>
                <Text style={styles.scoreValue}>
                  <Text style={styles.scoreHighlight}>{scoreCounter}</Text>/3
                </Text>
                <Text style={styles.scoreLabel}>Correct</Text>
              </View>
            </View>

            <View style={styles.paramsContent}>
              {/* 1) Industry Button */}
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>
                  <Ionicons name="business" size={16} color="#6543cc" /> Industry
                </Text>
                <TouchableOpacity
                  style={styles.industryButton}
                  onPress={() => !isGenerating && setShowIndustryModal(true)}
                  disabled={isGenerating}
                >
                  <Ionicons name="list" size={16} color="#fff" />
                  <Text style={styles.industryButtonText}>{industry}</Text>
                  <Ionicons name="chevron-down" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* 2) Attack Type input + suggestions */}
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>
                  <Ionicons name="skull" size={16} color="#6543cc" /> Attack Type
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="search" size={20} color="#6543cc" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Search or enter attack type..."
                    placeholderTextColor="#9da8b9"
                    value={attackType}
                    onChangeText={handleAttackTypeChange}
                    editable={!isGenerating}
                  />
                </View>

                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsPreview}>
                    {suggestions.slice(0, 3).map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={styles.suggestionPreviewItem}
                        onPress={() => selectSuggestion(sug)}
                      >
                        <Text style={styles.suggestionPreviewText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                    {suggestions.length > 3 && (
                      <TouchableOpacity style={styles.showAllButton} onPress={handleShowAllSuggestions}>
                        <Text style={styles.showAllText}>Show all ({suggestions.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* 3) Skill Level chips */}
              <View style={styles.paramGroup}>
                <Text style={styles.paramLabel}>
                  <Ionicons name="person" size={16} color="#6543cc" /> Attacker Skill Level
                </Text>
                <View style={styles.chipRow}>
                  {SKILL_LEVELS.map((level) => {
                    const active = skillLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => !isGenerating && setSkillLevel(level)}
                        disabled={isGenerating}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{level}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4) Threat Intensity Slider */}
              <View style={styles.paramGroup}>
                <View style={styles.sliderLabelContainer}>
                  <Text style={styles.paramLabel}>
                    <Ionicons name="thermometer" size={16} color="#6543cc" /> Threat Intensity
                  </Text>
                  <View style={styles.intensityBadge}>
                    <Text style={styles.intensityValue}>{threatIntensity}</Text>
                  </View>
                </View>

                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={threatIntensity}
                  onValueChange={(val) => setThreatIntensity(val)}
                  minimumTrackTintColor="#6543cc"
                  maximumTrackTintColor="#333333"
                  thumbTintColor="#6543cc"
                  disabled={isGenerating}
                />

                <View style={styles.sliderMarkers}>
                  <Text style={styles.sliderMarker}>Low</Text>
                  <Text style={styles.sliderMarker}>Medium</Text>
                  <Text style={styles.sliderMarker}>High</Text>
                </View>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                onPress={handleGenerateScenario}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>Generating...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Generate Scenario</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* If scenario is generated */}
          {scenarioGenerated && (
            <View style={styles.results}>
              {/* Scenario Output Card */}
              <View style={styles.outputCard}>
                <TouchableOpacity style={styles.outputHeader} onPress={() => setOutputExpanded(!outputExpanded)}>
                  <View style={styles.outputHeaderLeft}>
                    <Ionicons name="lock-closed" size={20} color="#6543cc" />
                    <Text style={styles.outputTitle}>Generated Scenario</Text>
                  </View>

                  <View style={styles.outputControls}>
                    {!generationComplete && isGenerating && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${streamProgress}%` }]} />
                        </View>
                        <Text style={styles.progressLabel}>Generating...</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.toggleButton}>
                      <Ionicons
                        name={outputExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#9da8b9"
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
                      <Text style={styles.scenarioText}>
                        {scenarioText}
                        {isGenerating && <Text style={styles.cursor}>|</Text>}
                      </Text>
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <ActivityIndicator color="#6543cc" size="large" animating={isGenerating} />
                        <Text style={styles.placeholderText}>Scenario will appear here...</Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Questions Card */}
              {interactiveQuestions.length > 0 && (
                <View style={styles.questionsCard}>
                  <TouchableOpacity
                    style={styles.questionsHeader}
                    onPress={() => setQuestionsExpanded(!questionsExpanded)}
                  >
                    <View style={styles.questionsHeaderLeft}>
                      <Ionicons name="help-circle" size={20} color="#6543cc" />
                      <Text style={styles.questionsTitle}>Knowledge Assessment</Text>
                    </View>

                    <TouchableOpacity style={styles.toggleButton}>
                      <Ionicons
                        name={questionsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#9da8b9"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {questionsExpanded && (
                    <View style={styles.questionsContent}>
                      {/* If user answered all questions, show "Assessment Complete" */}
                      {Object.keys(feedback).length === interactiveQuestions.length && (
                        <View style={styles.assessmentComplete}>
                          <Ionicons name="checkmark-circle" size={24} color="#2ebb77" />
                          <View style={styles.assessmentResults}>
                            <Text style={styles.completionMessage}>Assessment Complete</Text>
                            <Text style={styles.scoreMessage}>
                              You scored {scoreCounter} out of {interactiveQuestions.length} correct
                            </Text>
                          </View>
                        </View>
                      )}

                      {interactiveQuestions.map((question, index) => {
                        const questionFeedback = feedback[index];
                        const isCorrect = questionFeedback?.isCorrect;

                        return (
                          <View key={index} style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                              <Text style={styles.questionNumber}>Question {index + 1}</Text>
                              {questionFeedback && (
                                <View
                                  style={[
                                    styles.questionStatus,
                                    isCorrect ? styles.correctStatus : styles.incorrectStatus,
                                  ]}
                                >
                                  <Ionicons
                                    name={isCorrect ? 'checkmark' : 'close'}
                                    size={16}
                                    color={isCorrect ? '#2ebb77' : '#ff4e4e'}
                                  />
                                  <Text style={[styles.statusText, isCorrect ? styles.correctText : styles.incorrectText]}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.questionText}>{question.question}</Text>

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
                                        isSelected && styles.selectedOption,
                                        showCorrect && styles.correctOption,
                                        showIncorrect && styles.incorrectOption,
                                      ]}
                                      onPress={() => handleAnswerSelect(index, optionLetter)}
                                      disabled={Object.prototype.hasOwnProperty.call(userAnswers, index)}
                                    >
                                      <View
                                        style={[
                                          styles.optionLetter,
                                          showCorrect && styles.correctLetter,
                                          showIncorrect && styles.incorrectLetter,
                                        ]}
                                      >
                                        <Text style={styles.optionLetterText}>{optionLetter}</Text>
                                      </View>

                                      <Text style={styles.optionText}>{optionText}</Text>

                                      {showCorrect && (
                                        <Ionicons
                                          name="checkmark"
                                          size={20}
                                          color="#2ebb77"
                                          style={styles.optionIcon}
                                        />
                                      )}
                                      {showIncorrect && (
                                        <Ionicons
                                          name="close"
                                          size={20}
                                          color="#ff4e4e"
                                          style={styles.optionIcon}
                                        />
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                            </View>

                            {questionFeedback && (
                              <View style={styles.feedbackContainer}>
                                <Ionicons name="bulb" size={20} color="#ffc107" style={styles.feedbackIcon} />
                                <Text style={styles.feedbackExplanation}>{questionFeedback.explanation}</Text>
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
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIndustryModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowIndustryModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select an Industry</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowIndustryModal(false)}>
                    <Ionicons name="close" size={24} color="#e2e2e2" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={INDUSTRY_OPTIONS}
                  keyExtractor={(item) => item.value}
                  style={styles.modalList}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.modalListContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalSuggestionItem}
                      onPress={() => handleSelectIndustry(item.value)}
                    >
                      <Text style={styles.modalSuggestionText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Attack type “Show all suggestions” Modal */}
      <Modal
        visible={showSuggestionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestionsModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Attack Types</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSuggestionsModal(false)}>
                    <Ionicons name="close" size={24} color="#e2e2e2" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestionItem}
                  keyExtractor={(item) => item}
                  style={styles.modalList}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.modalListContent}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  /////////////////////////////////////////////////////////////////////////////
  container: {
    flex: 1,
    backgroundColor: '#0b0c15',
  },
  header: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    margin: 15,
    marginBottom: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 4,
    borderTopColor: '#6543cc',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e2e2e2',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9da8b9',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 78, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  errorText: {
    color: '#ff4e4e',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 5,
  },

  /////////////////////////////////////////////////////////////////////////////
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
    paddingTop: 0,
    paddingBottom: 30,
  },

  /////////////////////////////////////////////////////////////////////////////
  // Param card (industry, attack type, skill level, threat intensity)
  paramsCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  paramsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    color: '#e2e2e2',
  },
  scoreCounter: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  scoreHighlight: {
    color: '#6543cc',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9da8b9',
  },
  paramsContent: {
    padding: 15,
  },
  paramGroup: {
    marginBottom: 15,
  },
  paramLabel: {
    fontSize: 14,
    color: '#9da8b9',
    marginBottom: 8,
    fontWeight: '500',
  },

  // Industry Button
  industryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  industryButtonText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },

  // Attack type input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#e2e2e2',
    height: 50,
    fontSize: 16,
  },
  // Attack type suggestions preview
  suggestionsPreview: {
    backgroundColor: '#171a23',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    marginTop: 5,
    overflow: 'hidden',
  },
  suggestionPreviewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
  },
  suggestionPreviewText: {
    color: '#e2e2e2',
    fontSize: 14,
  },
  showAllButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
  },
  showAllText: {
    color: '#6543cc',
    fontSize: 14,
  },

  // Skill level chips
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
    borderColor: '#333333',
    backgroundColor: '#333333',
  },
  chipText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  chipActive: {
    backgroundColor: '#6543cc',
    borderColor: '#000',
  },
  chipTextActive: {
    color: '#fff',
  },

  // Threat Intensity
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityBadge: {
    backgroundColor: '#6543cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  intensityValue: {
    color: 'white',
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
    color: '#9da8b9',
  },

  // Generate Button
  generateButton: {
    backgroundColor: '#6543cc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: 'rgba(101, 67, 204, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /////////////////////////////////////////////////////////////////////////////
  // Results
  results: {
    gap: 20,
  },

  // Scenario output card
  outputCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
  outputHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    color: '#e2e2e2',
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6543cc',
  },
  progressLabel: {
    fontSize: 12,
    color: '#9da8b9',
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
    color: '#e2e2e2',
    fontSize: 16,
    lineHeight: 24,
  },
  cursor: {
    color: '#6543cc',
    fontWeight: 'bold',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 15,
  },
  placeholderText: {
    color: '#9da8b9',
    fontSize: 16,
  },

  // Knowledge Assessment card
  questionsCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  questionsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    color: '#e2e2e2',
  },
  questionsContent: {
    padding: 15,
  },
  assessmentComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 187, 119, 0.3)',
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
    color: '#e2e2e2',
    marginBottom: 5,
  },
  scoreMessage: {
    fontSize: 14,
    color: '#9da8b9',
  },
  questionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#2a2c3d',
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
    color: '#6543cc',
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  correctStatus: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
  },
  incorrectStatus: {
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  correctText: {
    color: '#2ebb77',
  },
  incorrectText: {
    color: '#ff4e4e',
  },
  questionText: {
    fontSize: 16,
    color: '#e2e2e2',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 10,
    padding: 12,
  },
  selectedOption: {
    borderColor: '#6543cc',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
  },
  correctOption: {
    borderColor: '#2ebb77',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
  },
  incorrectOption: {
    borderColor: '#ff4e4e',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
  },
  optionLetter: {
    width: 30,
    height: 30,
    backgroundColor: '#0b0c15',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  correctLetter: {
    backgroundColor: '#2ebb77',
  },
  incorrectLetter: {
    backgroundColor: '#ff4e4e',
  },
  optionLetterText: {
    color: '#e2e2e2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    color: '#e2e2e2',
    fontSize: 15,
    lineHeight: 22,
  },
  optionIcon: {
    marginLeft: 10,
  },
  feedbackContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
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
    color: '#9da8b9',
    lineHeight: 22,
  },

  /////////////////////////////////////////////////////////////////////////////
  // Full-screen Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#171a23',
    width: '90%',
    maxHeight: '70%',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#6543cc',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    padding: 10,
  },
  modalSuggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
  },
  modalSuggestionText: {
    fontSize: 16,
    color: '#e2e2e2',
  },
});

export default ScenarioSphereScreen;

