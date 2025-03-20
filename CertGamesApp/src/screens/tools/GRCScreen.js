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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { streamGRCQuestion } from '../../api/grcService';

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

// Difficulty “chips” data
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

// Color map for difficulty
const difficultyColors = {
  Easy: '#2ebb77',
  Medium: '#ffc107',
  Hard: '#ff4c8b',
};

const GRCScreen = () => {
  // States
  const [category, setCategory] = useState('Random');
  const [difficulty, setDifficulty] = useState('Easy');

  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // For category modal
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

  // The main “fetch question” logic
  const fetchQuestion = async () => {
    setLoading(true);
    setQuestionData(null);
    setSelectedOption(null);
    setShowExplanation(false);
    setErrorMessage('');

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

    setSelectedOption(optionIndex);
    const correctIndex = questionData.correct_answer_index;
    const isCorrect = optionIndex === correctIndex;

    setShowExplanation(true);

    Alert.alert(isCorrect ? 'Correct!' : 'Incorrect', '', [{ text: 'OK' }]);
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
    setCategory(value);
    setShowCategoryModal(false);
  };

  // Render each category item in the modal list
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item.value)}
    >
      <Text style={styles.categoryItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  // Render the row of difficulty “chips”
  const renderDifficultyChips = () => (
    <View style={styles.chipRow}>
      {DIFFICULTY_OPTIONS.map((diff) => {
        const active = difficulty === diff;
        return (
          <TouchableOpacity
            key={diff}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => !loading && setDifficulty(diff)}
            disabled={loading}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{diff}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>GRC Wizard</Text>
        <Text style={styles.subtitle}>Master the art of Governance, Risk, and Compliance</Text>
      </View>

      {/* ScrollView for entire content */}
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Card for generating a question */}
        <View style={styles.wizardCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Generate a Question</Text>
            <Text style={styles.cardSubtitle}>Select a category and difficulty level</Text>
          </View>

          <View style={styles.controls}>
            {/* Category selection */}
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => !loading && setShowCategoryModal(true)}
              disabled={loading}
            >
              <Ionicons name="list" size={16} color="#fff" />
              <Text style={styles.categoryButtonText}>{category}</Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>

            {/* Difficulty row of chips */}
            <Text style={styles.label}>Difficulty</Text>
            {renderDifficultyChips()}

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={fetchQuestion}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Generating</Text>
                </View>
              ) : questionData ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="sync" size={20} color="#fff" />
                  <Text style={styles.buttonText}>New Question</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="book" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Generate Question</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message box */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#ff4e4e" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* If question loaded, show it */}
        {questionData && (
          <View style={styles.questionCard}>
            {/* Top info */}
            <View style={styles.questionHeader}>
              <View style={styles.questionMeta}>
                <View style={styles.categoryContainer}>
                  <Ionicons
                    name={category === 'Random' ? 'shuffle' : 'shield-checkmark'}
                    size={16}
                    color="#AAAAAA"
                  />
                  <Text style={styles.questionCategory}> {category}</Text>
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
                    color={difficultyColors[difficulty]}
                  />
                  <Text style={[styles.questionDifficulty, { color: difficultyColors[difficulty] }]}>
                    {' '}
                    {difficulty}
                  </Text>
                </View>
              </View>
              <Text style={styles.questionTitle}>Question</Text>
            </View>

            {/* The question itself */}
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{questionData.question}</Text>

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
                          isSelected && styles.selectedOption,
                          showExplanation && isCorrect && styles.correctOption,
                          showExplanation && isSelected && !isCorrect && styles.incorrectOption,
                        ]}
                        onPress={() => handleAnswer(index)}
                        disabled={selectedOption !== null}
                      >
                        <View
                          style={[
                            styles.optionLetter,
                            showExplanation && isCorrect && styles.correctLetter,
                            showExplanation && isSelected && !isCorrect && styles.incorrectLetter,
                          ]}
                        >
                          <Text style={styles.optionLetterText}>{getLetterFromIndex(index)}</Text>
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                        {showExplanation && isCorrect && (
                          <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.statusIcon} />
                        )}
                        {showExplanation && isSelected && !isCorrect && (
                          <Ionicons name="close" size={20} color="#ff4e4e" style={styles.statusIcon} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>

            {/* If explanation is shown */}
            {showExplanation && selectedOption !== null && (
              <View style={styles.explanationContainer}>
                <View style={styles.explanationHeader}>
                  <View style={styles.explanationTitleContainer}>
                    {selectedOption === questionData.correct_answer_index ? (
                      <>
                        <Ionicons name="checkmark" size={20} color="#2ebb77" />
                        <Text style={styles.explanationTitle}> Correct Answer</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close" size={20} color="#ff4e4e" />
                        <Text style={styles.explanationTitle}> Incorrect Answer</Text>
                      </>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.copyButton, copiedToClipboard && styles.copiedButton]}
                    onPress={handleCopy}
                  >
                    {copiedToClipboard ? (
                      <View style={styles.copyButtonContent}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.copyButtonText}>Copied</Text>
                      </View>
                    ) : (
                      <View style={styles.copyButtonContent}>
                        <Ionicons name="copy" size={16} color="#fff" />
                        <Text style={styles.copyButtonText}>Copy</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.explanationContent}>
                  <View style={styles.explanationSection}>
                    <Text style={styles.explanationSectionTitle}>Explanation</Text>
                    <Text style={styles.explanationText}>
                      {questionData.explanations && questionData.explanations[selectedOption.toString()]}
                    </Text>
                  </View>

                  <View style={styles.explanationSection}>
                    <View style={styles.tipTitleContainer}>
                      <Ionicons name="bulb" size={18} color="#ffc107" />
                      <Text style={styles.explanationSectionTitle}> Exam Tip</Text>
                    </View>
                    <Text style={styles.tipText}>{questionData.exam_tip}</Text>
                  </View>
                </View>

                {/* “New Question” button */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.nextButton} onPress={getNewQuestion}>
                    <Ionicons name="sync" size={20} color="#fff" />
                    <Text style={styles.nextButtonText}>New Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORY_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    setCategory(item.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              style={styles.categoryList}
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
    backgroundColor: '#0b0c15',
  },
  header: {
    backgroundColor: '#171a23',
    padding: 20,
    borderRadius: 15,
    margin: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderTopWidth: 4,
    borderTopColor: '#6543cc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6543cc',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9da8b9',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  // “Wizard card” for the top control area
  wizardCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    shadowColor: '#000',
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
    color: '#e2e2e2',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9da8b9',
  },
  controls: {
    gap: 15,
  },
  label: {
    fontSize: 14,
    color: '#9da8b9',
    fontWeight: '500',
  },
  // Category selection button
  categoryButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  // Difficulty chips row
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    backgroundColor: '#333333',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: {
    color: '#9da8b9',
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
  // Generate Button
  generateButton: {
    backgroundColor: '#6543cc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(101, 67, 204, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
    marginTop: 5,
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
  // Error box
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 78, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    color: '#ff4e4e',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  // Question card
  questionCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  questionHeader: {
    padding: 20,
    backgroundColor: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
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
    color: '#9da8b9',
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
    color: '#e2e2e2',
  },
  questionContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#e2e2e2',
    lineHeight: 26,
    marginBottom: 25,
  },
  optionsContainer: {
    gap: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 10,
    padding: 15,
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
    marginRight: 15,
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
    fontSize: 16,
    lineHeight: 24,
  },
  statusIcon: {
    marginLeft: 10,
  },
  explanationContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
    color: '#e2e2e2',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  copiedButton: {
    backgroundColor: '#2ebb77',
    borderColor: 'transparent',
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  explanationContent: {
    gap: 20,
  },
  explanationSection: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2a2c3d',
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
    color: '#e2e2e2',
  },
  explanationText: {
    fontSize: 15,
    color: '#9da8b9',
    lineHeight: 22,
  },
  tipText: {
    fontSize: 15,
    color: '#9da8b9',
    lineHeight: 22,
    fontStyle: 'italic',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    paddingLeft: 10,
  },
  actionButtons: {
    alignItems: 'center',
    marginTop: 25,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4c8b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: 'rgba(255, 76, 139, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
    gap: 10,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Category modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#171a23',
    width: '90%',
    maxHeight: '70%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#6543cc',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6543cc',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryList: {
    padding: 10,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
  },
  categoryItemText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default GRCScreen;

