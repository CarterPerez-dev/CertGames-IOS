// src/screens/tests/TestListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  RefreshControl,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import testService from '../../api/testService';
import TestProgressComponent from '../../components/TestProgressComponent';

/**
 * TestListScreen displays a list of tests for a particular certification category
 * 
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing params
 * @param {Object} props.navigation - Navigation object
 * @returns {JSX.Element} - TestListScreen component
 */
const TestListScreen = ({ route, navigation }) => {
  // Get the category and title from route params, with fallbacks
  const { category: paramCategory, title: paramTitle } = route.params || {};
  const category = paramCategory || 'unknown';
  const title = paramTitle || 'Practice Tests';
  
  const { userId } = useSelector(state => state.user);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tests, setTests] = useState([]);
  const [attemptsData, setAttemptsData] = useState({});
  
  // Exam mode toggle
  const [examMode, setExamMode] = useState(false);
  
  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Test length
  const allowedTestLengths = [25, 50, 75, 100];
  const [selectedLengths, setSelectedLengths] = useState({});
  const [showTestLengthModal, setShowTestLengthModal] = useState(false);
  const [testForLength, setTestForLength] = useState(null);
  
  // Difficulty categories with colors and levels
  const difficultyCategories = [
    { label: "Normal", color: "#fff9e6", textColor: "#4a4a4a" },
    { label: "Very Easy", color: "#adebad", textColor: "#0b3800" },
    { label: "Easy", color: "#87cefa", textColor: "#000000" },
    { label: "Moderate", color: "#ffc765", textColor: "#4a2700" },
    { label: "Intermediate", color: "#ff5959", textColor: "#ffffff" },
    { label: "Formidable", color: "#dc3545", textColor: "#ffffff" },
    { label: "Challenging", color: "#b108f6", textColor: "#ffffff" },
    { label: "Very Challenging", color: "#4b0082", textColor: "#ffffff" },
    { label: "Ruthless", color: "#370031", textColor: "#ffffff" },
    { label: "Ultra Level", color: "#000000", textColor: "#00ffff" }
  ];
  
  // Load exam mode from storage
  useEffect(() => {
    const loadExamMode = async () => {
      try {
        const storedMode = await SecureStore.getItemAsync('examMode');
        setExamMode(storedMode === 'true');
      } catch (err) {
        console.error('Error loading exam mode:', err);
      }
    };
    
    loadExamMode();
  }, []);
  
  // Fetch tests and attempts
  const fetchTestsAndAttempts = useCallback(async () => {
    try {
      console.log(`Fetching tests for category: ${category}`);
      setLoading(true);
      
      // First, fetch all tests for this category
      try {
        const testsData = await testService.fetchTestsByCategory(category);
        console.log(`Received ${testsData?.length || 0} tests for ${category}`);
        setTests(testsData);
      } catch (testErr) {
        console.warn('Error fetching tests, using fallback method:', testErr);
        // Fallback: Create basic test structures for numbers 1-10
        const fallbackTests = Array.from({ length: 10 }, (_, i) => ({
          testId: i + 1,
          testName: `${category.toUpperCase()} Test ${i + 1}`,
          category: category,
          questionCount: 100
        }));
        setTests(fallbackTests);
      }
      
      // Then fetch user's attempts if logged in
      if (userId) {
        try {
          const attemptsData = await testService.listTestAttempts(userId);
          const attemptsList = attemptsData.attempts || [];
          
          // Filter attempts for this category
          const relevantAttempts = attemptsList.filter(a => a.category === category);
          
          // Process attempts to get best attempt per test
          const bestAttempts = {};
          for (let att of relevantAttempts) {
            const testKey = att.testId;
            
            // Skip attempts that don't have a valid testId
            if (testKey === undefined || testKey === null) continue;
            
            if (!bestAttempts[testKey]) {
              bestAttempts[testKey] = att;
            } else {
              const existing = bestAttempts[testKey];
              
              // If existing is finished and new is unfinished, keep finished
              if (existing.finished && !att.finished) {
                // Keep existing (finished beats unfinished)
              } 
              // If existing is unfinished and new is finished, use new
              else if (!existing.finished && att.finished) {
                bestAttempts[testKey] = att;
              }
              // If both are finished or both are unfinished, pick newest
              else {
                const existingTime = new Date(existing.finishedAt || existing.updatedAt || 0).getTime();
                const newTime = new Date(att.finishedAt || att.updatedAt || 0).getTime();
                
                if (newTime > existingTime) {
                  bestAttempts[testKey] = att;
                }
              }
            }
          }
          
          setAttemptsData(bestAttempts);
        } catch (attemptErr) {
          console.error('Error fetching attempts:', attemptErr);
          // Continue with empty attempts - don't fail the whole screen
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error in fetchTestsAndAttempts:', err);
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, category]);
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTestsAndAttempts();
    }, [fetchTestsAndAttempts])
  );
  
  // Save exam mode to storage when it changes
  useEffect(() => {
    SecureStore.setItemAsync('examMode', examMode ? 'true' : 'false');
  }, [examMode]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTestsAndAttempts();
  };
  
  // Handle exam mode toggle
  const toggleExamMode = () => {
    setExamMode(prev => !prev);
  };
  
  // Get attempt doc for a test
  const getAttemptDoc = (testNumber) => {
    return attemptsData[testNumber] || null;
  };
  
  // Get progress display for an attempt
  const getProgressDisplay = (attemptDoc) => {
    if (!attemptDoc) return { text: "Not started", percentage: 0 };
    
    const { finished, score, totalQuestions, currentQuestionIndex, examMode } = attemptDoc;
    const totalQuestionsPerTest = 100;
    
    if (finished === true) {
      const pct = Math.round((score / (totalQuestions || totalQuestionsPerTest)) * 100);
      return { 
        text: `Score: ${score}/${totalQuestions || totalQuestionsPerTest} (${pct}%)${examMode ? ' (Exam Mode)' : ''}`, 
        percentage: pct,
        isFinished: true,
        isExamMode: examMode === true
      };
    } else {
      if (typeof currentQuestionIndex === "number") {
        const progressPct = Math.round(((currentQuestionIndex + 1) / (totalQuestions || totalQuestionsPerTest)) * 100);
        return { 
          text: `Progress: ${currentQuestionIndex + 1}/${totalQuestions || totalQuestionsPerTest}${examMode ? ' (Exam Mode)' : ''}`, 
          percentage: progressPct,
          isFinished: false,
          isExamMode: examMode === true
        };
      }
      return { text: "Not started", percentage: 0 };
    }
  };
  
  // Start or resume a test
  const startTest = (testNumber, doRestart = false, existingAttempt = null) => {
    // For new tests (or restart), show length selector
    if (doRestart || !existingAttempt) {
      setTestForLength(testNumber);
      setShowTestLengthModal(true);
      return;
    }
    
    // For resuming, use attempt's exam mode
    const attemptExamMode = existingAttempt.examMode === true;
    
    // Navigate to test screen with appropriate params
    navigation.navigate('Test', {
      testId: testNumber,
      category,
      title: `${title} - Test ${testNumber}`,
      examMode: attemptExamMode,
      resuming: true
    });
  };
  
  // Create a new attempt with selected length
  const createNewAttempt = async (testNumber, selectedLength) => {
    try {
      if (!userId) {
        // If no user ID, just navigate with parameters 
        // The test page will handle creation of a new attempt
        navigation.navigate('Test', {
          testId: testNumber,
          category,
          title: `${title} - Test ${testNumber}`,
          examMode,
          restarting: true,
          selectedLength
        });
        return;
      }
      
      // Otherwise create attempt first then navigate
      const response = await testService.createOrUpdateAttempt(userId, testNumber, {
        answers: [],
        score: 0,
        totalQuestions: 100,
        selectedLength,
        category: category,
        currentQuestionIndex: 0,
        shuffleOrder: [], // Will be generated on the test screen
        answerOrder: [],  // Will be generated on the test screen
        finished: false,
        examMode,
      });
      
      navigation.navigate('Test', {
        testId: testNumber,
        category,
        title: `${title} - Test ${testNumber}`,
        examMode,
        restarting: true,
        selectedLength
      });
    } catch (err) {
      console.error("Failed to create new attempt:", err);
      
      // Navigate anyway, but with error notice
      navigation.navigate('Test', {
        testId: testNumber,
        category,
        title: `${title} - Test ${testNumber}`,
        examMode,
        restarting: true,
        selectedLength,
        error: "Failed to create attempt on server"
      });
    }
  };
  
  // Handle test length selection
  const handleTestLengthSelect = (length) => {
    setSelectedLengths(prev => ({
      ...prev,
      [testForLength]: length
    }));
  };
  
  // Confirm and start test with selected length
  const confirmTestLength = () => {
    const length = selectedLengths[testForLength] || 100;
    setShowTestLengthModal(false);
    createNewAttempt(testForLength, length);
  };
  
  // Render each test item in the list
  const renderTestItem = ({ item }) => {
    // Handle if item is a test object or just a number
    const testNumber = typeof item === 'object' ? item.testId : item;
    const testName = typeof item === 'object' ? item.testName : `Test ${testNumber}`;
    
    const attemptDoc = getAttemptDoc(testNumber);
    const progress = getProgressDisplay(attemptDoc);
    const difficulty = difficultyCategories[testNumber - 1] || difficultyCategories[0];
    
    const isFinished = attemptDoc?.finished;
    const noAttempt = !attemptDoc;
    const inProgress = attemptDoc && !isFinished;
    
    return (
      <View style={[
        styles.testCard,
        isFinished && styles.completedCard,
        inProgress && styles.progressCard
      ]}>
        <View style={styles.testCardHeader}>
          <Text style={styles.testNumberText}>{testName}</Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: difficulty.color }
          ]}>
            <Text style={[styles.difficultyText, { color: difficulty.textColor }]}>
              {difficulty.label}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>{progress.text}</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                isFinished && styles.completedBar,
                { width: `${progress.percentage}%` }
              ]}
            />
          </View>
        </View>
        
        {/* Test Length Selector (for new or finished tests) */}
        {(noAttempt || isFinished) && (
          <View style={styles.lengthSelector}>
            <Text style={styles.lengthLabel}>Questions:</Text>
            <View style={styles.lengthOptions}>
              {allowedTestLengths.map(length => (
                <TouchableOpacity
                  key={length}
                  style={[
                    styles.lengthOption,
                    (selectedLengths[testNumber] || 100) === length && styles.selectedLength
                  ]}
                  onPress={() => setSelectedLengths(prev => ({
                    ...prev,
                    [testNumber]: length
                  }))}
                >
                  <Text style={[
                    styles.lengthOptionText,
                    (selectedLengths[testNumber] || 100) === length && styles.selectedLengthText
                  ]}>
                    {length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          {noAttempt && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => startTest(testNumber, false, null)}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Test</Text>
            </TouchableOpacity>
          )}
          
          {inProgress && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.resumeButton}
                onPress={() => startTest(testNumber, false, attemptDoc)}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {attemptDoc?.examMode ? "Resume Exam" : "Resume"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.restartButton}
                onPress={() => {
                  setSelectedTest(testNumber);
                  setShowRestartModal(true);
                }}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isFinished && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={() => navigation.navigate('Test', {
                  testId: testNumber,
                  category,
                  title: `${title} - Test ${testNumber}`,
                  review: true
                })}
              >
                <Ionicons name="eye" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>View Results</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.restartButton}
                onPress={() => startTest(testNumber, true, attemptDoc)}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {isFinished && progress.percentage >= 80 && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </View>
        )}
      </View>
    );
  };
  
  // Handle restart confirmation
  const confirmRestart = () => {
    setShowRestartModal(false);
    const attemptDoc = getAttemptDoc(selectedTest);
    startTest(selectedTest, true, attemptDoc);
  };
  
  // Render the progress component if we have test data
  const renderProgressComponent = () => {
    // Only render if tests and userId are available
    if (tests.length > 0 && userId) {
      return <TestProgressComponent category={category} />;
    }
    return null;
  };
  
  // If no userId, show login prompt
  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authMessage}>
          <Ionicons name="lock-closed" size={50} color="#6543CC" />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Please log in to access the practice tests</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Practice Test Collection</Text>
        </View>
        
        <View style={styles.examModeToggle}>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle" size={24} color="#AAAAAA" />
          </TouchableOpacity>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Exam Mode</Text>
            <TouchableOpacity 
              style={[styles.toggle, examMode && styles.toggleActive]}
              onPress={toggleExamMode}
            >
              <View style={[styles.toggleHandle, examMode && styles.toggleHandleActive]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Progress Component */}
      {renderProgressComponent()}
      
      {/* Loading Indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      )}
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF4E4E" />
          <Text style={styles.errorTitle}>Error Loading Tests</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchTestsAndAttempts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Test List */}
      {!loading && !error && (
        <FlatList
          data={tests.length > 0 ? tests : Array.from({ length: 10 }, (_, i) => i + 1)}
          keyExtractor={item => (typeof item === 'object' ? item.testId.toString() : item.toString())}
          renderItem={renderTestItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#6543CC"]}
              tintColor="#6543CC"
            />
          }
        />
      )}
      
      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exam Mode</Text>
            <Text style={styles.modalText}>
              Exam Mode simulates a real exam environment:
              {'\n\n'}• No immediate feedback on answers
              {'\n'}• See results only after completing the test
              {'\n'}• Answers cannot be changed after submission
              {'\n'}• Time is tracked for the entire session
              {'\n\n'}This is perfect for final exam preparation!
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Restart Confirmation Modal */}
      <Modal
        visible={showRestartModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRestartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={30} color="#FFC107" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Restart</Text>
            <Text style={styles.modalText}>
              You're currently in progress on Test {selectedTest}. Are you sure you want to restart?
              {'\n\n'}All current progress will be lost, and your test will begin with your selected length.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmRestart}
              >
                <Text style={styles.modalButtonText}>Yes, Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRestartModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Test Length Modal */}
      <Modal
        visible={showTestLengthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTestLengthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Test Length</Text>
            <Text style={styles.modalText}>
              How many questions would you like to answer?
              {examMode ? '\n\nExam Mode is ON' : ''}
            </Text>
            
            <View style={styles.lengthModalOptions}>
              {allowedTestLengths.map(length => (
                <TouchableOpacity
                  key={length}
                  style={[
                    styles.lengthModalOption,
                    (selectedLengths[testForLength] || 100) === length && styles.selectedLengthModalOption
                  ]}
                  onPress={() => handleTestLengthSelect(length)}
                >
                  <Text style={[
                    styles.lengthModalOptionText,
                    (selectedLengths[testForLength] || 100) === length && styles.selectedLengthModalOptionText
                  ]}>
                    {length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmTestLength}
              >
                <Text style={styles.modalButtonText}>Start Test</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTestLengthModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6543CC',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  examModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 5,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 10,
  },
  toggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2A2A2A',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#6543CC',
  },
  toggleHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleHandleActive: {
    alignSelf: 'flex-end',
  },
  listContent: {
    padding: 15,
    paddingBottom: 50, // Extra padding at bottom
  },
  testCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  completedCard: {
    borderColor: '#2EBB77',
  },
  progressCard: {
    borderColor: '#6543CC',
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  testNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    padding: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6543CC',
  },
  completedBar: {
    backgroundColor: '#2EBB77',
  },
  lengthSelector: {
    padding: 15,
    paddingTop: 0,
  },
  lengthLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  lengthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lengthOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLength: {
    backgroundColor: '#6543CC',
    borderColor: '#7E65D3',
  },
  lengthOptionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  selectedLengthText: {
    fontWeight: 'bold',
  },
  actionButtons: {
    padding: 15,
    paddingTop: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: '#6543CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  resumeButton: {
    backgroundColor: '#6543CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  restartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  reviewButton: {
    backgroundColor: '#2EBB77',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  achievementBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading and Error states
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorMessage: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6543CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Auth message
  authMessage: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
  authSubtitle: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#6543CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    width: '85%',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    color: '#CCCCCC',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#6543CC',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Test Length Modal specific
  lengthModalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lengthModalOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedLengthModalOption: {
    backgroundColor: '#6543CC',
    borderColor: '#7E65D3',
  },
  lengthModalOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectedLengthModalOptionText: {
    fontWeight: 'bold',
  },
});

export default TestListScreen;
