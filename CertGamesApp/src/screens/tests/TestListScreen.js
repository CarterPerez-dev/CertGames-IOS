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
  Modal
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import testService from '../../api/testService';
import { DIFFICULTY_CATEGORIES, TEST_LENGTHS, EXAM_MODE_INFO } from '../../constants/testConstants';

/**
 * TestListScreen displays a list of tests for a particular certification category
 * 
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing params
 * @param {Object} props.navigation - Navigation object
 * @returns {JSX.Element} - TestListScreen component
 */
const TestListScreen = ({ route, navigation }) => {
  const { category, title } = route.params || {};
  const { userId } = useSelector(state => state.user);
  
  // Access theme
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
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
  const allowedTestLengths = TEST_LENGTHS;
  const [selectedLengths, setSelectedLengths] = useState({});
  const [showTestLengthModal, setShowTestLengthModal] = useState(false);
  const [testForLength, setTestForLength] = useState(null);
  
  // Difficulty categories with colors and levels
  const difficultyCategories = DIFFICULTY_CATEGORIES;
  
  // Fetch tests and attempts
  const fetchTestsAndAttempts = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, fetch generated test data for this category (similar to web app)
      try {
        const testsData = await testService.fetchTestsByCategory(category);
        setTests(testsData);
      } catch (testErr) {
        console.error('Error generating tests:', testErr);
        setError(testErr.message || 'Failed to load tests');
        setLoading(false);
        return;
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
      
      // Load the exam mode from storage
      const loadExamMode = async () => {
        try {
          const storedMode = await SecureStore.getItemAsync('examMode');
          setExamMode(storedMode === 'true');
        } catch (err) {
          console.error('Error loading exam mode:', err);
        }
      };
      
      loadExamMode();
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
      const response = await testService.createOrUpdateAttempt(userId, testNumber, {
        category,
        answers: [],
        score: 0,
        totalQuestions: 100,
        selectedLength,
        currentQuestionIndex: 0,
        shuffleOrder: [], // Will be generated on the test screen
        answerOrder: [],  // Will be generated on the test screen
        finished: false,
        examMode,
      });
      
      if (!response) {
        throw new Error("Failed to create attempt document");
      }
      
      // Navigate to test screen
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
      Alert.alert("Error", "Failed to start test. Please try again.");
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
        {
          backgroundColor: theme.colors.surface,
          borderColor: isFinished 
            ? theme.colors.success 
            : inProgress 
              ? theme.colors.primary 
              : theme.colors.border
        }
      ]}>
        <LinearGradient
          colors={isFinished 
            ? [theme.colors.success + '20', theme.colors.surface] 
            : inProgress 
              ? [theme.colors.primary + '20', theme.colors.surface]
              : [theme.colors.surface, theme.colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.testCardHeader}
        >
          <Text style={[styles.testNumberText, { color: theme.colors.text }]}>{testName}</Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: difficulty.color }
          ]}>
            <Text style={[styles.difficultyText, { color: difficulty.textColor }]}>
              {difficulty.label}
            </Text>
          </View>
        </LinearGradient>
        
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>{progress.text}</Text>
          <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.progressTrack }]}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${progress.percentage}%`,
                  backgroundColor: isFinished 
                    ? theme.colors.success 
                    : theme.colors.progressIndicator
                }
              ]}
            />
          </View>
        </View>
        
        {/* Test Length Selector (for new or finished tests) */}
        {(noAttempt || isFinished) && (
          <View style={styles.lengthSelector}>
            <Text style={[styles.lengthLabel, { color: theme.colors.textSecondary }]}>Questions:</Text>
            <View style={styles.lengthOptions}>
              {allowedTestLengths.map(length => (
                <TouchableOpacity
                  key={length}
                  style={[
                    styles.lengthOption,
                    { 
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: (selectedLengths[testNumber] || 100) === length 
                        ? theme.colors.primary 
                        : theme.colors.border
                    },
                    (selectedLengths[testNumber] || 100) === length && {
                      backgroundColor: theme.colors.primary + '20',
                    }
                  ]}
                  onPress={() => setSelectedLengths(prev => ({
                    ...prev,
                    [testNumber]: length
                  }))}
                >
                  <Text style={[
                    styles.lengthOptionText,
                    { color: theme.colors.text },
                    (selectedLengths[testNumber] || 100) === length && {
                      color: theme.colors.primary,
                      fontWeight: 'bold'
                    }
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
              style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => startTest(testNumber, false, null)}
            >
              <Ionicons name="play" size={18} color={theme.colors.buttonText} />
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Start Test</Text>
            </TouchableOpacity>
          )}
          
          {inProgress && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.resumeButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => startTest(testNumber, false, attemptDoc)}
              >
                <Ionicons name="play" size={18} color={theme.colors.buttonText} />
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                  {attemptDoc?.examMode ? "Resume Exam" : "Resume"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.restartButton, { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: theme.colors.border
                }]}
                onPress={() => {
                  setSelectedTest(testNumber);
                  setShowRestartModal(true);
                }}
              >
                <Ionicons name="refresh" size={18} color={theme.colors.text} />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isFinished && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.reviewButton, { backgroundColor: theme.colors.success }]}
                onPress={() => navigation.navigate('Test', {
                  testId: testNumber,
                  category,
                  title: `${title} - Test ${testNumber}`,
                  review: true
                })}
              >
                <Ionicons name="eye" size={18} color={theme.colors.buttonText} />
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>View Results</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.restartButton, { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: theme.colors.border
                }]}
                onPress={() => startTest(testNumber, true, attemptDoc)}
              >
                <Ionicons name="refresh" size={18} color={theme.colors.text} />
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {isFinished && progress.percentage >= 80 && (
          <View style={[styles.achievementBadge, { backgroundColor: theme.colors.goldBadge + '20' }]}>
            <Ionicons name="trophy" size={20} color={theme.colors.goldBadge} />
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
  
  // If no userId, show login prompt
  if (!userId) {
    return (
      <View style={[globalStyles.screen, styles.container]}>
        <View style={styles.authMessage}>
          <Ionicons name="lock-closed" size={50} color={theme.colors.primary} />
          <Text style={[globalStyles.title, styles.authTitle]}>Login Required</Text>
          <Text style={[globalStyles.textSecondary, styles.authSubtitle]}>Please log in to access the practice tests</Text>
          <TouchableOpacity 
            style={[globalStyles.buttonPrimary, styles.loginButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={globalStyles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // If loading, show spinner
  if (loading && !refreshing) {
    return (
      <View style={[globalStyles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[globalStyles.text, styles.loadingText]}>Loading tests...</Text>
      </View>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <View style={[globalStyles.errorContainer]}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={[globalStyles.title, styles.errorTitle]}>Error Loading Tests</Text>
        <Text style={[globalStyles.textSecondary, styles.errorMessage]}>{error}</Text>
        <TouchableOpacity 
          style={[globalStyles.buttonPrimary, styles.retryButton]}
          onPress={fetchTestsAndAttempts}
        >
          <Text style={globalStyles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[globalStyles.screen, styles.container]}>
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Practice Test Collection</Text>
        </View>
        
        <View style={styles.examModeToggle}>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
          
          <View style={[styles.toggleContainer, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Exam Mode</Text>
            <TouchableOpacity 
              style={[
                styles.toggle, 
                { backgroundColor: examMode ? theme.colors.primary : theme.colors.surface }
              ]}
              onPress={toggleExamMode}
            >
              <View style={[
                styles.toggleHandle, 
                { backgroundColor: theme.colors.buttonText },
                examMode && { alignSelf: 'flex-end' }
              ]} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <FlatList
        data={tests}
        keyExtractor={item => (typeof item === 'object' ? item.testId.toString() : item.toString())}
        renderItem={renderTestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      />
      
      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Exam Mode</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
              {EXAM_MODE_INFO}
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>Got It</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <Ionicons name="warning" size={30} color={theme.colors.warning} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Confirm Restart</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
              You're currently in progress on Test {selectedTest}. Are you sure you want to restart?
              {'\n\n'}All current progress will be lost, and your test will begin with your selected length.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={confirmRestart}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>Yes, Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.border
                }]}
                onPress={() => setShowRestartModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Test Length</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
              How many questions would you like to answer?
              {examMode ? '\n\nExam Mode is ON' : ''}
            </Text>
            
            <View style={styles.lengthModalOptions}>
              {allowedTestLengths.map(length => (
                <TouchableOpacity
                  key={length}
                  style={[
                    styles.lengthModalOption,
                    { 
                      backgroundColor: (selectedLengths[testForLength] || 100) === length
                        ? theme.colors.primary + '20'
                        : theme.colors.inputBackground,
                      borderColor: (selectedLengths[testForLength] || 100) === length
                        ? theme.colors.primary
                        : theme.colors.border
                    }
                  ]}
                  onPress={() => handleTestLengthSelect(length)}
                >
                  <Text style={[
                    styles.lengthModalOptionText,
                    { color: theme.colors.text },
                    (selectedLengths[testForLength] || 100) === length && {
                      color: theme.colors.primary,
                      fontWeight: 'bold'
                    }
                  ]}>
                    {length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={confirmTestLength}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>Start Test</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.border
                }]}
                onPress={() => setShowTestLengthModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 5,
  },
  toggleLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  toggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  listContent: {
    padding: 15,
  },
  testCard: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  testNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  lengthSelector: {
    padding: 15,
    paddingTop: 0,
  },
  lengthLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  lengthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lengthOption: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  lengthOptionText: {
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading and Error states
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorTitle: {
    marginTop: 15,
  },
  errorMessage: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  // Auth message
  authMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    marginTop: 15,
  },
  authSubtitle: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    width: '85%',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
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
    // backgroundColor styling moved to inline
  },
  cancelButton: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
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
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  lengthModalOptionText: {
    fontSize: 16,
  },
});

export default TestListScreen;
