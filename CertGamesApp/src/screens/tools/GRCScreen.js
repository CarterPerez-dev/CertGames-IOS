// src/screens/tools/GRCScreen.js
import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { streamGRCQuestion } from '../../api/grcService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const { width, height } = Dimensions.get('window');

// We'll define the category list for our modal
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
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
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

  // The main "fetch question" logic
  const fetchQuestion = async () => {
    setLoading(true);
    setQuestionData(null);
    setSelectedOption(null);
    setShowExplanation(false);
    setErrorMessage('');

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const data = await streamGRCQuestion(category, difficulty);

      // Safe logging - only partial
      if (data && data.question) {
        console.log('GRC Question received:', data.question.substring(0, 50) + '...');
      }

      setQuestionData(data);
    } catch (error) {
      console.error('Error fetching question:', error);
      setErrorMessage('Failed to load question. Please try again.');
      Alert.alert('Error', 'Error fetching question. Please try again.', [{ text: 'OK' }]);
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
    
    // Removed Alert.alert popup for correct/incorrect as requested
  };

  // Copy entire question+explanation
  const handleCopy = async () => {
    if (!questionData || !showExplanation) return;

    try {
      const correctIndex = questionData.correct_answer_index;
      const correctExplanation = questionData.explanations[correctIndex.toString()];
      const examTip = questionData.exam_tip;

      const textToCopy = `Question: ${questionData.question}\n\nOptions:\n${questionData.options
        .map((opt, i) => `${i + 1}. ${opt}`)
        .join('\n')}\n\nCorrect Answer: ${
        questionData.options[correctIndex]
      }\n\nExplanation: ${correctExplanation}\n\nExam Tip: ${examTip}`;

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
            `${theme.colors.primary}20` : 'transparent'
        }
      ]}
      onPress={() => handleCategorySelect(item.value)}
    >
      <Text style={[styles.categoryItemText, { color: theme.colors.text }]}>{item.label}</Text>
      {item.value === category && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Render the row of difficulty "chips"
  const renderDifficultyChips = () => (
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
                  color: active ? theme.colors.buttonText : theme.colors.textSecondary
                }
              ]}
            >
              {diff}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>GRC Wizard</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Master the art of Governance, Risk, and Compliance
        </Text>
      </LinearGradient>

      {/* ScrollView for entire content */}
      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card for generating a question */}
        <View style={[styles.wizardCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Generate a Question</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              Select a category and difficulty level
            </Text>
          </View>

          <View style={styles.controls}>
            {/* Category selection */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}
              onPress={() => !loading && setShowCategoryModal(true)}
              disabled={loading}
            >
              <Ionicons name="list" size={16} color={theme.colors.primary} />
              <Text style={[styles.categoryButtonText, { color: theme.colors.inputText }]}>{category}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.inputText} />
            </TouchableOpacity>

            {/* Difficulty row of chips */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Difficulty</Text>
            {renderDifficultyChips()}

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
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generating</Text>
                </View>
              ) : questionData ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="sync" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>New Question</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="book" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generate Question</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message box */}
        {errorMessage ? (
          <View style={[
            styles.errorContainer, 
            { 
              backgroundColor: `${theme.colors.error}10`,
              borderColor: `${theme.colors.error}30`
            }
          ]}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Loading Card */}
        {loading && !questionData && (
          <View style={[
            styles.loadingCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
          ]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Preparing your question...
            </Text>
            <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
              This will only take a moment.
            </Text>
          </View>
        )}

        {/* If question loaded, show it */}
        {questionData && (
          <View style={[styles.questionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {/* Top info */}
            <View style={[styles.questionHeader, { backgroundColor: `${theme.colors.primary}20` }]}>
              <View style={styles.questionMeta}>
                <View style={styles.categoryContainer}>
                  <Ionicons
                    name={category === 'Random' ? 'shuffle' : 'shield-checkmark'}
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.questionCategory, { color: theme.colors.textSecondary }]}> {category}</Text>
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
                    { color: getDifficultyColor(difficulty) }
                  ]}>
                    {' '}
                    {difficulty}
                  </Text>
                </View>
              </View>
              <Text style={[styles.questionTitle, { color: theme.colors.text }]}>Question</Text>
            </View>

            {/* The question itself */}
            <View style={styles.questionContent}>
              <Text style={[styles.questionText, { color: theme.colors.text }]}>{questionData.question}</Text>

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
                              { color: theme.colors.text },
                              (showExplanation && (isCorrect || (isSelected && !isCorrect))) && 
                                { color: theme.colors.buttonText }
                            ]}
                          >
                            {getLetterFromIndex(index)}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: theme.colors.text }]}>{option}</Text>
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
              <View style={[styles.explanationContainer, { backgroundColor: `${theme.colors.primary}10`, borderTopColor: theme.colors.border }]}>
                <View style={styles.explanationHeader}>
                  <View style={styles.explanationTitleContainer}>
                    {selectedOption === questionData.correct_answer_index ? (
                      <>
                        <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                        <Text style={[styles.explanationTitle, { color: theme.colors.text }]}> Correct Answer</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close" size={20} color={theme.colors.error} />
                        <Text style={[styles.explanationTitle, { color: theme.colors.text }]}> Incorrect Answer</Text>
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
                        <Text style={[styles.copyButtonText, { color: theme.colors.buttonText }]}>Copied</Text>
                      </View>
                    ) : (
                      <View style={styles.copyButtonContent}>
                        <Ionicons name="copy" size={16} color={theme.colors.buttonText} />
                        <Text style={[styles.copyButtonText, { color: theme.colors.buttonText }]}>Copy</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.explanationContent}>
                  <View style={[styles.explanationSection, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
                    <Text style={[styles.explanationSectionTitle, { color: theme.colors.text }]}>Explanation</Text>
                    <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                      {questionData.explanations && questionData.explanations[selectedOption.toString()]}
                    </Text>
                  </View>

                  <View style={[styles.explanationSection, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
                    <View style={styles.tipTitleContainer}>
                      <Ionicons name="bulb" size={18} color={theme.colors.warning} />
                      <Text style={[styles.explanationSectionTitle, { color: theme.colors.text }]}> Exam Tip</Text>
                    </View>
                    <Text style={[styles.tipText, { color: theme.colors.textSecondary, borderLeftColor: theme.colors.warning }]}>
                      {questionData.exam_tip}
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
                    <Text style={[styles.nextButtonText, { color: theme.colors.buttonText }]}>New Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* Bottom spacer for better scrolling */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary
            }
          ]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.buttonText }]}>Select a Category</Text>
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
        </View>
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
    padding: 20,
    borderRadius: 15,
    margin: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderTopWidth: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  // "Wizard card" for the top control area
  wizardCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  controls: {
    gap: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  loadingSubtext: {
    fontSize: 14,
  },
  // Question card
  questionCard: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: "#000",
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
  },
  questionCategory: {
    fontSize: 14,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionDifficulty: {
    fontSize: 14,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  explanationSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  // Category modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 15,
    borderWidth: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  bottomSpacer: {
    height: 100, // Extra padding at bottom for scrolling
  },
});

export default GRCScreen;
