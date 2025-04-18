// src/screens/tests/TestScreen.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

// Import theme context
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

// Replace all direct fetch calls with testService
import testService from '../../api/testService';

import { fetchShopItems } from '../../store/slices/shopSlice';
import { fetchAchievements } from '../../store/slices/achievementsSlice';
import { setXPAndCoins, decrementQuestions } from '../../store/slices/userSlice';

import FormattedQuestion from '../../components/FormattedQuestion';
// Import for freemium check
import usePremiumCheck from '../../hooks/usePremiumCheck';
import QuestionLimitBanner from '../../components/QuestionLimitBanner';


const { width, height } = Dimensions.get('window');

// Helper functions
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const shuffleIndices = (length) => {
  const indices = Array.from({ length }, (_, i) => i);
  return shuffleArray(indices);
};

/**
 * TestScreen shows a test with questions and handles user interactions
 *
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing params
 * @param {Object} props.navigation - Navigation object
 * @returns {JSX.Element} - TestScreen component
 */
const TestScreen = ({ route, navigation }) => {
  // Get theme context
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  const {
    testId,
    category,
    examMode: initialExamMode,
    review,
    resuming,
    restarting,
    selectedLength: initialSelectedLength
  } = route.params || {};

  const dispatch = useDispatch();
  const { userId, xp, level, coins, xpBoost, currentAvatar, subscriptionActive, practiceQuestionsRemaining } = useSelector(state => state.user);
  const { items: shopItems = [], status: shopStatus } = useSelector(state => state.shop || { items: [], status: 'idle' });
  const { all: achievements = [] } = useSelector(state => state.achievements || { all: [] });

  // Freemium check
  const { hasAccess, navigateToPremiumFeaturePrompt } = usePremiumCheck('questions');

  // State for test data
  const [testData, setTestData] = useState(null);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examMode, setExamMode] = useState(initialExamMode || false);

  // UI state
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');

  // Modals
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showReviewMode, setShowReviewMode] = useState(review || false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);


  // Selected test length
  const [activeTestLength, setActiveTestLength] = useState(initialSelectedLength || 100);

  useEffect(() => {
    if (userId && shopStatus === 'idle') {
      dispatch(fetchShopItems());
    }
  }, [userId, shopStatus, dispatch]);

  useEffect(() => {
    if (userId && !achievements.length) {
      dispatch(fetchAchievements());
    }
  }, [userId, achievements.length, dispatch]);

  // Fetch test data and attempt
  const fetchTestAndAttempt = useCallback(async () => {
    try {
      setLoading(true);

      let attemptDoc = null;

      // If user is logged in, fetch attempt data
      if (userId) {
        // For restarting, we fetch a fresh attempt
        if (restarting) {
          console.log('Restarting test, using fresh attempt');
        }
        // For resuming or reviewing, fetch the existing attempt
        else if (resuming || review) {
          const status = review ? 'finished' : 'unfinished';
          try {
            const attemptData = await testService.fetchTestAttempt(userId, testId, status);
            if (attemptData?.attempt) {
              attemptDoc = attemptData.attempt;
            }
          } catch (err) {
            // If no attempt found, attemptDoc remains null
          }
        }
        // Otherwise check for any unfinished attempt first
        else {
          try {
            const unfinishedData = await testService.fetchTestAttempt(userId, testId, 'unfinished');
            if (unfinishedData?.attempt) {
              attemptDoc = unfinishedData.attempt;
            } else if (review) {
              const finishedData = await testService.fetchTestAttempt(userId, testId, 'finished');
              if (finishedData?.attempt) {
                attemptDoc = finishedData.attempt;
              }
            }
          } catch (err) {
            // If no attempt found, attemptDoc remains null
          }
        }
      }

      // Fetch the test data from the service
      const testDoc = await testService.fetchTestById(category, testId);
      setTestData(testDoc);
      const totalQ = testDoc.questions.length;

      // If we found an existing attemptDoc
      if (attemptDoc) {
        setAnswers(attemptDoc.answers || []);
        setScore(attemptDoc.score || 0);
        setIsFinished(attemptDoc.finished === true);

        // Use the exam mode from the attempt doc
        const attemptExam = attemptDoc.examMode === true;
        setExamMode(attemptExam);

        // Use the chosen length if available
        const chosenLength = attemptDoc.selectedLength || totalQ;
        setActiveTestLength(chosenLength);

        // Use saved shuffleOrder if valid
        if (
          attemptDoc.shuffleOrder &&
          Array.isArray(attemptDoc.shuffleOrder) &&
          attemptDoc.shuffleOrder.length === chosenLength
        ) {
          setShuffleOrder(attemptDoc.shuffleOrder);
        } else {
          // Create new shuffle order
          const newQOrder = shuffleIndices(chosenLength);
          setShuffleOrder(newQOrder);

          // Immediately save the new order if not in review mode
          if (userId && !review) {
            await testService.createOrUpdateAttempt(userId, testId, {
              category,
              answers: attemptDoc.answers || [],
              score: attemptDoc.score || 0,
              totalQuestions: totalQ,
              selectedLength: chosenLength,
              currentQuestionIndex: attemptDoc.currentQuestionIndex || 0,
              shuffleOrder: newQOrder,
              answerOrder: attemptDoc.answerOrder || [],
              finished: attemptDoc.finished === true,
              examMode: attemptExam
            });
          }
        }

        // Use saved answerOrder if valid
        if (
          attemptDoc.answerOrder &&
          Array.isArray(attemptDoc.answerOrder) &&
          attemptDoc.answerOrder.length === chosenLength
        ) {
          setAnswerOrder(attemptDoc.answerOrder);
        } else {
          // Create new answer order
          const generatedAnswerOrder = testDoc.questions
            .slice(0, chosenLength)
            .map((q) => {
              const numOptions = q.options.length;
              return shuffleArray([...Array(numOptions).keys()]);
            });
          setAnswerOrder(generatedAnswerOrder);

          // Save immediately
          if (userId && !review) {
            await testService.createOrUpdateAttempt(userId, testId, {
              category,
              answers: attemptDoc.answers || [],
              score: attemptDoc.score || 0,
              totalQuestions: totalQ,
              selectedLength: chosenLength,
              currentQuestionIndex: attemptDoc.currentQuestionIndex || 0,
              shuffleOrder: attemptDoc.shuffleOrder || [],
              answerOrder: generatedAnswerOrder,
              finished: attemptDoc.finished === true,
              examMode: attemptExam
            });
          }
        }

        setCurrentQuestionIndex(attemptDoc.currentQuestionIndex || 0);

        // If in review mode and the attempt is finished, show review
        if (review && attemptDoc.finished) {
          setShowReviewMode(true);
        }
      } else if (restarting) {
        // For a restart, create new shuffle and answer orders
        const selectedLength = initialSelectedLength || 100;
        setActiveTestLength(selectedLength);

        const newQOrder = shuffleIndices(selectedLength);
        setShuffleOrder(newQOrder);

        const newAnswerOrder = testDoc.questions
          .slice(0, selectedLength)
          .map((q) => {
            const numOptions = q.options.length;
            return shuffleArray([...Array(numOptions).keys()]);
          });
        setAnswerOrder(newAnswerOrder);

        // Save the new attempt
        if (userId) {
          await testService.createOrUpdateAttempt(userId, testId, {
            category,
            answers: [],
            score: 0,
            totalQuestions: totalQ,
            selectedLength,
            currentQuestionIndex: 0,
            shuffleOrder: newQOrder,
            answerOrder: newAnswerOrder,
            finished: false,
            examMode
          });
        }
      } else {
        // No attempt doc found, show error
        setError('No test attempt found. Please return to the test list and start a new test.');
      }
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    testId,
    category,
    review,
    resuming,
    restarting,
    initialSelectedLength,
    initialExamMode,
    examMode
  ]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTestAndAttempt();
    }, [fetchTestAndAttempt])
  );

  // Save progress when unmounting
  useEffect(() => {
    return () => {
      if (userId && testId && testData && !loading && !isFinished && !review) {
        const saveProgressOnExit = async () => {
          try {
            await testService.createOrUpdateAttempt(userId, testId, {
              category,
              answers,
              score,
              totalQuestions: testData?.questions?.length || 0,
              selectedLength: activeTestLength,
              currentQuestionIndex,
              shuffleOrder,
              answerOrder,
              finished: isFinished,
              examMode
            });
          } catch (err) {
            console.error("Failed to save progress on exit", err);
          }
        };

        saveProgressOnExit();
      }
    };
  }, [
    userId,
    testId,
    testData,
    loading,
    category,
    answers,
    score,
    activeTestLength,
    currentQuestionIndex,
    shuffleOrder,
    answerOrder,
    isFinished,
    examMode,
    review
  ]);


  // Get the shuffled index for the current question
  const getShuffledIndex = useCallback(
    (i) => {
      if (!shuffleOrder || shuffleOrder.length === 0) return i;
      return shuffleOrder[i];
    },
    [shuffleOrder]
  );

  // Total number of questions in this test
  const effectiveTotal = activeTestLength || (testData ? testData.questions.length : 0);

  // Get the current question based on shuffled index
  const realIndex = getShuffledIndex(currentQuestionIndex);
  const questionObject = useMemo(() => {
    if (!testData || !testData.questions || !testData.questions.length) return null;
    return testData.questions[realIndex];
  }, [testData, realIndex]);

  // Check if the current question is answered
  useEffect(() => {
    if (!questionObject) return;

    const existing = answers.find(a => a.questionId === questionObject.id);
    if (existing) {
      setSelectedOptionIndex(null);

      if (existing.userAnswerIndex !== null && existing.userAnswerIndex !== undefined) {
        const displayIndex = answerOrder[realIndex].indexOf(existing.userAnswerIndex);
        if (displayIndex >= 0) {
          setSelectedOptionIndex(displayIndex);
          setIsAnswered(true);
        } else {
          setIsAnswered(false);
        }
      } else {
        setIsAnswered(false);
      }
    } else {
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    }
  }, [questionObject, answers, realIndex, answerOrder]);

  // Update progress on server
  const updateServerProgress = useCallback(
    async (updatedAnswers, updatedScore, finished = false, singleAnswer = null) => {
      if (!userId) return;

      try {
        // If we're submitting a single answer
        if (singleAnswer) {
          // Replace direct fetch with testService.submitAnswer
          const data = await testService.submitAnswer(userId, {
            testId,
            questionId: singleAnswer.questionId,
            correctAnswerIndex: singleAnswer.correctAnswerIndex,
            selectedIndex: singleAnswer.userAnswerIndex,
            xpPerCorrect: (testData?.xpPerCorrect || 10) * xpBoost,
            coinsPerCorrect: 5
          });

          // In exam mode, also update the full attempt
          if (examMode) {
            await testService.createOrUpdateAttempt(userId, testId, {
              category,
              answers: updatedAnswers,
              score: updatedScore,
              totalQuestions: testData?.questions?.length || 0,
              selectedLength: activeTestLength,
              currentQuestionIndex,
              shuffleOrder,
              answerOrder,
              finished,
              examMode
            });
          }

          return data;
        }

        // Update position data
        await testService.updatePosition(userId, testId, {
          currentQuestionIndex,
          finished
        });

        // Then update the entire attempt
        await testService.createOrUpdateAttempt(userId, testId, {
          category,
          answers: updatedAnswers,
          score: updatedScore,
          totalQuestions: testData?.questions?.length || 0,
          selectedLength: activeTestLength,
          currentQuestionIndex,
          shuffleOrder,
          answerOrder,
          finished,
          examMode
        });
      } catch (err) {
        console.error("Failed to update test attempt on backend", err);
      }
    },
    [
      userId,
      testId,
      testData,
      xpBoost,
      currentQuestionIndex,
      category,
      activeTestLength,
      shuffleOrder,
      answerOrder,
      examMode
    ]
  );

  // Handle option selection
  const handleOptionClick = useCallback(
    async (displayOptionIndex) => {
      if (!questionObject) return;
      if (!examMode && isAnswered) return; // Block if already answered in non-exam mode

      // NEW: Check if free user has remaining questions
      if (!subscriptionActive && practiceQuestionsRemaining <= 0) {
        navigateToPremiumFeaturePrompt();
        return;
      }

      const actualAnswerIndex = answerOrder[realIndex][displayOptionIndex];
      setSelectedOptionIndex(displayOptionIndex);

      // Mark as answered (in exam mode, user can change until finishing)
      setIsAnswered(true);

      try {
        const newAnswerObj = {
          questionId: questionObject.id,
          userAnswerIndex: actualAnswerIndex,
          correctAnswerIndex: questionObject.correctAnswerIndex
        };

        const updatedAnswers = [...answers];
        const idx = updatedAnswers.findIndex(a => a.questionId === questionObject.id);

        if (idx >= 0) {
          updatedAnswers[idx] = newAnswerObj;
        } else {
          updatedAnswers.push(newAnswerObj);
        }

        setAnswers(updatedAnswers);

        // Submit single answer
        const awardData = await updateServerProgress(
          updatedAnswers,
          score,
          false,
          newAnswerObj
        );

        // If not exam mode, update local score and XP
        if (!examMode && awardData && awardData.examMode === false) {
          if (awardData.isCorrect) {
            setScore(prev => prev + 1);
          }

          if (awardData.isCorrect && !awardData.alreadyCorrect && awardData.awardedXP) {
            // Use the action creator for Redux updates - FORCE IMMEDIATE UPDATE
            dispatch(setXPAndCoins({
              xp: awardData.newXP,
              coins: awardData.newCoins,
              newlyUnlocked: awardData.newlyUnlocked || []
            }));
          }

          // NEW: Decrement question count for free users IMMEDIATELY AFTER ANSWER
          if (!subscriptionActive) {
            // Use direct dispatch to ensure it happens immediately
            dispatch(decrementQuestions(userId));
          }
        }
      } catch (err) {
        console.error("Failed to submit answer to backend", err);
      }
    },
    [
      isAnswered,
      questionObject,
      examMode,
      dispatch,
      score,
      answers,
      updateServerProgress,
      realIndex,
      answerOrder,
      subscriptionActive,
      practiceQuestionsRemaining,
      userId,
      navigateToPremiumFeaturePrompt
    ]
  );

  // Skip the current question
  const skipQuestion = useCallback(async () => {
    if (!questionObject) return false;
    
    // NEW: Check if free user has remaining questions
    if (!subscriptionActive && practiceQuestionsRemaining <= 0) {
      navigateToPremiumFeaturePrompt();
      return false;
    }
    
    const updatedAnswers = [...answers];
    const idx = updatedAnswers.findIndex(a => a.questionId === questionObject.id);
    
    const skipObj = {
      questionId: questionObject.id,
      userAnswerIndex: null,
      correctAnswerIndex: questionObject.correctAnswerIndex
    };
    
    if (idx >= 0) {
      updatedAnswers[idx] = skipObj;
    } else {
      updatedAnswers.push(skipObj);
    }
    
    setAnswers(updatedAnswers);
    setIsAnswered(false);
    setSelectedOptionIndex(null);
    
    await updateServerProgress(updatedAnswers, score, false, skipObj);
    
    // NEW: Decrement question count for free users IMMEDIATELY
    if (!subscriptionActive) {
      dispatch(decrementQuestions(userId));
    }
    
    // If this is the last question, finish the test
    if (currentQuestionIndex === activeTestLength - 1) {
      return await finishTestProcess();
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    return true;
  }, [
    questionObject, 
    answers, 
    score, 
    updateServerProgress, 
    currentQuestionIndex, 
    activeTestLength,
    finishTestProcess,
    subscriptionActive,
    practiceQuestionsRemaining,
    userId,
    navigateToPremiumFeaturePrompt,
    dispatch
  ]);
  

  // Finish the test with retry logic
  const finishTestProcess = useCallback(async () => {
    let finalScore = 0;
  
    // Calculate final score
    answers.forEach(ans => {
      if (ans.userAnswerIndex === ans.correctAnswerIndex) {
        finalScore++;
      }
    });
  
    setScore(finalScore);
    setIsFinished(true);
  
    try {
      // Make sure we have all required parameters
      if (!userId || !testId || !category) {
        console.error("Missing required fields:", { userId, testId, category });
        throw new Error("Missing required data");
      }
  
      // First update the attempt to ensure it exists
      await testService.createOrUpdateAttempt(userId, testId, {
        category,
        answers,
        score: finalScore,
        totalQuestions: effectiveTotal,
        selectedLength: activeTestLength,
        currentQuestionIndex,
        shuffleOrder,
        answerOrder,
        // Mark as finished to prevent any issues
        finished: true,
        examMode
      });
  
      // Then call the finish endpoint
      const finishData = await testService.finishTestAttempt(userId, testId, {
        score: finalScore,
        totalQuestions: effectiveTotal,
        testId,
        category
      });
      
      // Update Redux store
      if (finishData && finishData.newXP !== undefined) {
        dispatch(setXPAndCoins({
          xp: finishData.newXP,
          coins: finishData.newCoins,
          newlyUnlocked: finishData.newlyUnlocked || []
        }));
      }
    } catch (err) {
      console.error("Failed to finish test attempt:", err);
      // Even if we fail, continue to show score modal
    }
    
    // Always show score and mark test as completed
    setShowScoreModal(true);
    navigation.setParams({ testJustCompleted: true });
    
    return { success: true };
  }, [
    answers, 
    userId, 
    testId, 
    effectiveTotal, 
    dispatch, 
    category, 
    activeTestLength, 
    currentQuestionIndex, 
    shuffleOrder, 
    answerOrder, 
    examMode,
    navigation
  ]);
  
  // Navigate to the next question
  const handleNextQuestion = useCallback(async () => {
    if (!isAnswered && !examMode) {
      setShowWarningModal(true);
      return { success: false, message: 'Please answer or skip the question' };
    }
    
    // If this is the last question, finish the test
    if (currentQuestionIndex === activeTestLength - 1) {
      return await finishTestProcess();
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    await updateServerProgress(answers, score, false);
    return { success: true };
  }, [
    isAnswered, 
    examMode, 
    currentQuestionIndex, 
    activeTestLength, 
    answers, 
    score, 
    updateServerProgress,
    finishTestProcess
  ]);
  
  // Navigate to the previous question
  const handlePreviousQuestion = useCallback(async () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      await updateServerProgress(answers, score, false);
      return true;
    }
    return false;
  }, [currentQuestionIndex, answers, score, updateServerProgress]);
  
  // Toggle flag on the current question
  const handleFlagQuestion = useCallback(() => {
    if (!questionObject) return;
    
    const qId = questionObject.id;
    if (flaggedQuestions.includes(qId)) {
      setFlaggedQuestions(prev => prev.filter(id => id !== qId));
    } else {
      setFlaggedQuestions(prev => [...prev, qId]);
    }
  }, [questionObject, flaggedQuestions]);
  
  // Restart the test
  const handleRestartTest = useCallback(async () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers([]);
    setFlaggedQuestions([]);
    setIsFinished(false);
    setShowReviewMode(false);
    setShowScoreModal(false);

    if (testData?.questions?.length && activeTestLength) {
      const newQOrder = shuffleIndices(activeTestLength);
      setShuffleOrder(newQOrder);

      const newAnswerOrder = testData.questions
        .slice(0, activeTestLength)
        .map(q => {
          const numOpts = q.options.length;
          return shuffleArray([...Array(numOpts).keys()]);
        });

      setAnswerOrder(newAnswerOrder);

      if (userId) {
        await testService.createOrUpdateAttempt(userId, testId, {
          answers: [],
          score: 0,
          totalQuestions: testData.questions.length,
          selectedLength: activeTestLength,
          category: testData.category || category,
          currentQuestionIndex: 0,
          shuffleOrder: newQOrder,
          answerOrder: newAnswerOrder,
          finished: false,
          examMode
        });
      }
    }
  }, [
    testData,
    userId,
    testId,
    category,
    examMode,
    activeTestLength
  ]);

  // Show review mode
  const handleReviewAnswers = () => {
    setShowReviewMode(true);
    setReviewFilter('all');
  };

  // Close review mode
  const handleCloseReview = () => {
    if (!isFinished) {
      setShowReviewMode(false);
    } else {
      // If the test is finished, navigate back to test list
      navigation.goBack();
    }
  };

  // Filter questions for review mode
  const filteredQuestions = useMemo(() => {
    if (!testData || !testData.questions) return [];

    return testData.questions.slice(0, effectiveTotal).filter(q => {
      const userAns = answers.find(a => a.questionId === q.id);
      const isFlagged = flaggedQuestions.includes(q.id);

      if (!userAns) {
        // Not answered => count it as "skipped" or "all"
        return reviewFilter === 'skipped' || reviewFilter === 'all';
      }

      const isSkipped = userAns.userAnswerIndex === null;
      const isCorrect = userAns.userAnswerIndex === q.correctAnswerIndex;

      if (reviewFilter === 'all') return true;
      if (reviewFilter === 'skipped' && isSkipped) return true;
      if (reviewFilter === 'flagged' && isFlagged) return true;
      if (reviewFilter === 'incorrect' && !isCorrect && !isSkipped) return true;
      if (reviewFilter === 'correct' && isCorrect && !isSkipped) return true;

      return false;
    });
  }, [testData, answers, flaggedQuestions, reviewFilter, effectiveTotal]);

  // Select a specific question from the dropdown
  const handleQuestionSelect = (index) => {
    setCurrentQuestionIndex(index);
    updateServerProgress(answers, score, false);
    setShowDropdown(false);
  };

  // Get the status of a question for the dropdown
  const getQuestionStatus = (index) => {
    const realIndex = shuffleOrder[index];
    if (!testData || !testData.questions || realIndex === undefined) return {};

    const question = testData.questions[realIndex];
    if (!question) return {};

    const answer = answers.find(a => a.questionId === question.id);
    const isFlagged = flaggedQuestions.includes(question.id);
    const isAnswered = answer?.userAnswerIndex !== undefined;
    const isSkipped = answer?.userAnswerIndex === null;
    const isCorrect = answer && answer.userAnswerIndex === question.correctAnswerIndex;

    return { isAnswered, isSkipped, isCorrect, isFlagged };
  };

  // Calculate progress percentage
  const progressPercentage = effectiveTotal
    ? Math.round(((currentQuestionIndex + 1) / effectiveTotal) * 100)
    : 0;

  // Get avatar URL
  const avatarUrl = useMemo(() => {
    if (currentAvatar && shopItems && shopItems.length > 0) {
      const avatarItem = shopItems.find(item => item._id === currentAvatar);
      if (avatarItem && avatarItem.imageUrl) {
        return testService.formatImageUrl(avatarItem.imageUrl);
      }
    }
    return null; // Will use the default local asset
  }, [currentAvatar, shopItems]);

  // Get shuffled options for current question
  const displayedOptions = useMemo(() => {
    if (!questionObject || !answerOrder[realIndex]) return [];
    return answerOrder[realIndex].map(
      optionIdx => questionObject.options[optionIdx]
    );
  }, [questionObject, answerOrder, realIndex]);


  // Render warning modal
  const renderWarningModal = () => {
    if (!showWarningModal) return null;

    return (
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }]}>
            <Ionicons name="warning" size={30} color={theme.colors.warning} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>NO ANSWER SELECTED</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              You haven't answered this question yet. Please select an answer or skip the question.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render restart modal
  const renderRestartModal = () => {
    if (!showRestartModal) return null;

    return (
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
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>CONFIRM RESTART</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              Are you sure you want to restart the test? All progress will be lost and you'll start from the beginning.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowRestartModal(false);
                  handleRestartTest();
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>YES, RESTART</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }]}
                onPress={() => setShowRestartModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render finish modal
  const renderFinishModal = () => {
    if (!showFinishModal) return null;

    return (
      <Modal
        visible={showFinishModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }]}>
            <Ionicons name="warning" size={30} color={theme.colors.warning} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>CONFIRM FINISH</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              Are you sure you want to finish the test now? Any unanswered questions will be marked as skipped.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowFinishModal(false);
                  finishTestProcess();
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>YES, FINISH</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }]}
                onPress={() => setShowFinishModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render score modal
  const renderScoreModal = () => {
    if (!showScoreModal) return null;

    const percentage = effectiveTotal
      ? Math.round((score / effectiveTotal) * 100)
      : 0;

    // Determine grade based on percentage
    let grade = "";
    let gradeColor = "";

    if (percentage >= 90) {
      grade = "🧙";
      gradeColor = theme.colors.success;
    } else if (percentage >= 80) {
      grade = "😎";
      gradeColor = theme.colors.success;
    } else if (percentage >= 70) {
      grade = "🫡";
      gradeColor = theme.colors.info;
    } else if (percentage >= 60) {
      grade = "😔";
      gradeColor = theme.colors.warning;
    } else {
      grade = "💀";
      gradeColor = theme.colors.error;
    }

    return (
      <Modal
        visible={showScoreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScoreModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, styles.scoreModalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }]}>
            <Text style={[styles.scoreTitle, { color: theme.colors.primary, fontFamily: 'Orbitron-Bold' }]}>TEST COMPLETE!</Text>

            <View style={styles.scoreContainer}>
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                  You answered <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{score}</Text> out of <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{effectiveTotal}</Text> questions correctly.
                </Text>
                
                {examMode && (
                  <View style={[styles.examModeNote, { backgroundColor: theme.colors.goldBadge + '20' }]}>
                    <Ionicons name="trophy" size={20} color={theme.colors.goldBadge} />
                    <Text style={[styles.examModeText, { color: theme.colors.goldBadge, fontFamily: 'ShareTechMono' }]}>You completed this test in exam mode!</Text>
                  </View>
                )}
              </View>
              
              <View style={[styles.scoreCircleContainer, { borderColor: gradeColor }]}>
                <Text style={[styles.percentageDisplay, { color: gradeColor, fontFamily: 'Orbitron-Bold' }]}>{percentage}%</Text>
                <Text style={[styles.gradeLabel, { color: gradeColor }]}>{grade}</Text>
              </View>
            </View>

            <View style={styles.scoreButtons}>
              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowScoreModal(false); 
                  setTimeout(() => setShowRestartModal(true), 300); 
                }}
              >
                <View style={styles.scoreButtonInner}>
                  <Ionicons name="refresh" size={18} color={theme.colors.buttonText} />
                  <Text style={[styles.scoreButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>RESTART</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: theme.colors.success }]}
                onPress={() => {
                  setShowScoreModal(false);
                  setTimeout(() => {
                    setShowReviewMode(true);
                    setReviewFilter('all');
                  }, 300); 
                }}
              >
                <View style={styles.scoreButtonInner}>
                  <Ionicons name="eye" size={18} color={theme.colors.buttonText} />
                  <Text style={[styles.scoreButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>REVIEW ANSWERS</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scoreButton, { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }]}
                onPress={() => navigation.goBack()}
              >
                <View style={styles.scoreButtonInner}>
                  <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
                  <Text style={[styles.scoreButtonText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>BACK TO LIST</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render review mode
  const renderReviewMode = () => {
    if (!showReviewMode) return null;

    return (
      <Modal
        visible={showReviewMode}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseReview}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, styles.reviewModalContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }]}>
            <View style={styles.reviewHeader}>
              <TouchableOpacity
                style={styles.closeReviewButton}
                onPress={handleCloseReview}
              >
                <Ionicons name="close" size={24} color={theme.colors.icon} />
              </TouchableOpacity>
              <Text style={[styles.reviewTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>REVIEW MODE</Text>

              {isFinished && (
                <Text style={[styles.reviewScoreSummary, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  Your score: {score}/{effectiveTotal} ({effectiveTotal ? Math.round((score / effectiveTotal) * 100) : 0}%)
                </Text>
              )}
            </View>

            <View style={styles.reviewFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewFiltersScroll}>
                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    reviewFilter === 'all' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.inputBackground }
                  ]}
                  onPress={() => setReviewFilter('all')}
                >
                  <Ionicons name="list" size={18} color={reviewFilter === 'all' ? theme.colors.buttonText : theme.colors.icon} />
                  <Text style={[
                    styles.filterButtonText, 
                    { color: reviewFilter === 'all' ? theme.colors.buttonText : theme.colors.textSecondary, fontFamily: 'ShareTechMono' }
                  ]}>ALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    reviewFilter === 'skipped' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.inputBackground }
                  ]}
                  onPress={() => setReviewFilter('skipped')}
                >
                  <Ionicons name="play-skip-forward" size={18} color={reviewFilter === 'skipped' ? theme.colors.buttonText : theme.colors.icon} />
                  <Text style={[
                    styles.filterButtonText, 
                    { color: reviewFilter === 'skipped' ? theme.colors.buttonText : theme.colors.textSecondary, fontFamily: 'ShareTechMono' }
                  ]}>SKIPPED</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    reviewFilter === 'flagged' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.inputBackground }
                  ]}
                  onPress={() => setReviewFilter('flagged')}
                >
                  <Ionicons name="flag" size={18} color={reviewFilter === 'flagged' ? theme.colors.buttonText : theme.colors.icon} />
                  <Text style={[
                    styles.filterButtonText, 
                    { color: reviewFilter === 'flagged' ? theme.colors.buttonText : theme.colors.textSecondary, fontFamily: 'ShareTechMono' }
                  ]}>FLAGGED</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    reviewFilter === 'incorrect' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.inputBackground }
                  ]}
                  onPress={() => setReviewFilter('incorrect')}
                >
                  <Ionicons name="close-circle" size={18} color={reviewFilter === 'incorrect' ? theme.colors.buttonText : theme.colors.icon} />
                  <Text style={[
                    styles.filterButtonText, 
                    { color: reviewFilter === 'incorrect' ? theme.colors.buttonText : theme.colors.textSecondary, fontFamily: 'ShareTechMono' }
                  ]}>INCORRECT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    reviewFilter === 'correct' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.inputBackground }
                  ]}
                  onPress={() => setReviewFilter('correct')}
                >
                  <Ionicons name="checkmark-circle" size={18} color={reviewFilter === 'correct' ? theme.colors.buttonText : theme.colors.icon} />
                  <Text style={[
                    styles.filterButtonText, 
                    { color: reviewFilter === 'correct' ? theme.colors.buttonText : theme.colors.textSecondary, fontFamily: 'ShareTechMono' }
                  ]}>CORRECT</Text>
                </TouchableOpacity>
              </ScrollView>

              <Text style={[styles.filterCount, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                SHOWING {filteredQuestions.length} QUESTIONS
              </Text>
            </View>

            <FlatList
              data={filteredQuestions}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => {
                const userAns = answers.find(a => a.questionId === item.id);
                const isFlagged = flaggedQuestions.includes(item.id);

                // Determine answer status
                let answerStatus = { 
                  type: 'unanswered', 
                  label: 'Not Answered', 
                  color: theme.colors.warning, 
                  icon: 'alert',
                  borderColor: theme.colors.warning
                };

                if (userAns) {
                  const isSkipped = userAns.userAnswerIndex === null;
                  const isCorrect = userAns.userAnswerIndex === item.correctAnswerIndex;

                  if (isSkipped) {
                    answerStatus = { 
                      type: 'skipped', 
                      label: 'Skipped', 
                      color: theme.colors.warning, 
                      icon: 'play-skip-forward',
                      borderColor: theme.colors.warning
                    };
                  } else if (isCorrect) {
                    answerStatus = { 
                      type: 'correct', 
                      label: 'Correct!', 
                      color: theme.colors.success, 
                      icon: 'checkmark-circle',
                      borderColor: theme.colors.success
                    };
                  } else {
                    answerStatus = { 
                      type: 'incorrect', 
                      label: 'Incorrect', 
                      color: theme.colors.error, 
                      icon: 'close-circle',
                      borderColor: theme.colors.error
                    };
                  }
                }

                return (
                  <View style={[
                    styles.reviewQuestionCard, 
                    { 
                      backgroundColor: theme.colors.surfaceHighlight,
                      borderLeftColor: answerStatus.borderColor
                    }
                  ]}>
                    <View style={styles.reviewQuestionHeader}>
                      <Text style={[styles.reviewQuestionNumber, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>QUESTION {index + 1}</Text>
                      {isFlagged && (
                        <Ionicons name="flag" size={18} color={theme.colors.warning} style={styles.flaggedIcon} />
                      )}
                    </View>

                    <View style={styles.reviewQuestionContent}>
                      <FormattedQuestion questionText={item.question} />
                    </View>

                    <View style={[
                      styles.answerSection, 
                      { 
                        backgroundColor: answerStatus.color + '10',
                        borderColor: theme.colors.divider
                      }
                    ]}>
                      <View style={styles.answerStatusRow}>
                        <Ionicons name={answerStatus.icon} size={20} color={answerStatus.color} />
                        <Text style={[styles.answerStatusText, { color: answerStatus.color, fontFamily: 'ShareTechMono' }]}>
                          {answerStatus.label}
                        </Text>
                      </View>

                      {userAns && userAns.userAnswerIndex !== null && (
                        <Text style={[styles.yourAnswerText, { color: theme.colors.text }]}>
                          <Text style={[styles.answerLabel, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>Your Answer: </Text>
                          {item.options[userAns.userAnswerIndex]}
                        </Text>
                      )}

                      <Text style={[styles.correctAnswerText, { color: theme.colors.text }]}>
                        <Text style={[styles.answerLabel, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>Correct Answer: </Text>
                        {item.options[item.correctAnswerIndex]}
                      </Text>
                    </View>

                    <View style={[styles.explanationSection, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>{item.explanation}</Text>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.reviewList}
            />

            {!isFinished && (
              <TouchableOpacity
                style={[styles.closeReviewButtonBottom, { backgroundColor: theme.colors.primary }]}
                onPress={handleCloseReview}
              >
                <Text style={[styles.closeReviewButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>RETURN TO TEST</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render dropdown for question selection
  const renderQuestionDropdown = () => {
    if (!showDropdown) return null;

    return (
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={[styles.dropdownOverlay, { backgroundColor: theme.colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdownContent, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dropdownHeader}
            >
              <Text style={[styles.dropdownHeaderText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                SELECT QUESTION
              </Text>
            </LinearGradient>
            
            <FlatList
              data={Array.from({ length: effectiveTotal }, (_, i) => i)}
              keyExtractor={item => item.toString()}
              renderItem={({ item: index }) => {
                const status = getQuestionStatus(index);

                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.colors.border },
                      index === currentQuestionIndex && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    onPress={() => handleQuestionSelect(index)}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      QUESTION {index + 1}
                    </Text>
                    <View style={styles.dropdownItemStatus}>
                      {status.isSkipped && (
                        <Ionicons name="play-skip-forward" size={18} color={theme.colors.warning} />
                      )}
                      {status.isFlagged && (
                        <Ionicons name="flag" size={18} color={theme.colors.warning} />
                      )}
                      {!examMode && status.isAnswered && !status.isSkipped && (
                        <Ionicons
                          name={status.isCorrect ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={status.isCorrect ? theme.colors.success : theme.colors.error}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.dropdownList}
            />
            <TouchableOpacity
              style={[styles.closeDropdownButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={[styles.closeDropdownText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Show loading spinner while data is loading
  if (loading) {
    return (
      <View style={[globalStyles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[globalStyles.text, styles.loadingText, { fontFamily: 'ShareTechMono' }]}>LOADING TEST DATA...</Text>
      </View>
    );
  }

  // Show error screen if there's an error
  if (error) {
    return (
      <View style={[globalStyles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={[globalStyles.title, styles.errorTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>ERROR LOADING TEST</Text>
        <Text style={[globalStyles.textSecondary, styles.errorMessage, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>{error}</Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchTestAndAttempt()}
          >
            <Text style={[styles.errorButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>TRY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorButton, styles.errorBackButton, { 
              backgroundColor: 'transparent',
              borderColor: theme.colors.border,
            }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.errorButtonTextBack, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>BACK TO TESTS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show error if test data or questions are missing
  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <View style={[globalStyles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={[globalStyles.title, styles.errorTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>NO QUESTIONS FOUND</Text>
        <Text style={[globalStyles.textSecondary, styles.errorMessage, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>This test doesn't have any questions yet.</Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.errorButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>BACK TO TESTS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[globalStyles.screen, styles.container]}>
      {/* Modals */}
      {renderWarningModal()}
      {renderRestartModal()}
      {renderFinishModal()}
      {renderScoreModal()}
      {renderReviewMode()}
      {renderQuestionDropdown()}

      {/* NEW: Display the QuestionLimitBanner if not premium */}
      {!subscriptionActive && <QuestionLimitBanner />}

      {/* Upper controls */}
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <View style={styles.userInfoSection}>
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatarImage}
              defaultSource={require('../../../assets/default-avatar.png')}
              onError={(e) => {
                console.log('Avatar image failed to load:', avatarUrl);
                // On error, we fall back to the placeholder anyway
              }}
            />
          ) : (
            <Image 
              source={require('../../../assets/default-avatar.png')}
              style={styles.avatarImage}
            />
          )}
          <View style={styles.userStats}>
            <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="trophy" size={12} color={theme.colors.buttonText} />
              <Text style={[styles.levelText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>{level}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.xpDisplay, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                <Ionicons name="star" size={12} color={theme.colors.goldBadge} />
                <Text style={[styles.xpText, { color: theme.colors.goldBadge, fontFamily: 'ShareTechMono' }]}>{xp} XP</Text>
              </View>
              <View style={[styles.coinsDisplay, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                <Ionicons name="cash" size={12} color={theme.colors.success} />
                <Text style={[styles.coinsText, { color: theme.colors.success, fontFamily: 'ShareTechMono' }]}>{coins}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.testInfo}>
          <View style={[styles.testNumberBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.testNumberText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
              #{testId}
            </Text>
          </View>
        </View>

        <View style={styles.testControls}>
          <TouchableOpacity
            style={[styles.restartTestButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowRestartModal(true)}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Question controls */}
      <View style={[styles.questionControlBar, { 
        backgroundColor: theme.colors.surface,
        shadowColor: theme.colors.shadow,
      }]}>
        <TouchableOpacity
          style={[
            styles.flagButton,
            { backgroundColor: theme.colors.surface },
            questionObject && flaggedQuestions.includes(questionObject.id) && 
              { backgroundColor: theme.colors.warning + '20' }
          ]}
          onPress={handleFlagQuestion}
        >
          <Ionicons
            name="flag"
            size={18}
            color={
              questionObject && flaggedQuestions.includes(questionObject.id)
                ? theme.colors.warning
                : theme.colors.icon
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.questionDropdownButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={[styles.questionDropdownText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
            QUESTION {currentQuestionIndex + 1} OF {effectiveTotal}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.buttonText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: theme.colors.error }]}
          onPress={() => setShowFinishModal(true)}
        >
          <Ionicons name="checkmark-done-circle" size={18} color={theme.colors.buttonText} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.progressTrack }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercentage}%`,
              backgroundColor: theme.colors.progressIndicator
            }
          ]}
        />
      </View>

      {/* Question content */}
      <ScrollView 
        style={[styles.questionScrollView, { backgroundColor: theme.colors.background }]} 
        contentContainerStyle={styles.questionContainer}
      >
        <View style={[styles.questionCard, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          width: '97%',
          alignSelf: 'center'
        }]}>
          {/* Question text */}
          <View style={[styles.questionTextContainer, { borderBottomColor: theme.colors.border }]}>
            {questionObject && (
              <FormattedQuestion questionText={questionObject.question} />
            )}
          </View>

          {/* Answer options */}
          <View style={styles.optionsContainer}>
            {displayedOptions.map((option, displayIdx) => {
              let optionStyle = [styles.optionButton, { 
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border 
              }];
              let textStyle = [styles.optionText, { color: theme.colors.text }];

              // Add styles based on answer status
              if (!examMode) {
                if (isAnswered && questionObject) {
                  const correctIndex = questionObject.correctAnswerIndex;
                  const actualIndex = answerOrder[realIndex][displayIdx];

                  if (actualIndex === correctIndex) {
                    optionStyle.push({ 
                      backgroundColor: theme.colors.success + '20',
                      borderColor: theme.colors.success 
                    });
                    textStyle.push({ color: theme.colors.success, fontWeight: 'bold' });
                  } else if (
                    displayIdx === selectedOptionIndex &&
                    actualIndex !== correctIndex
                  ) {
                    optionStyle.push({ 
                      backgroundColor: theme.colors.error + '20',
                      borderColor: theme.colors.error 
                    });
                    textStyle.push({ color: theme.colors.error });
                  }
                }
              } else {
                // In exam mode, just highlight the selected option
                if (isAnswered && displayIdx === selectedOptionIndex) {
                  optionStyle.push({ 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary 
                  });
                  textStyle.push({ color: theme.colors.primary, fontWeight: 'bold' });
                }
              }

              return (
                <TouchableOpacity
                  key={displayIdx}
                  style={optionStyle}
                  onPress={() => handleOptionClick(displayIdx)}
                  disabled={examMode ? false : isAnswered}
                >
                  <Text style={textStyle}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation (shown after answering in non-exam mode) */}
          {isAnswered && questionObject && !examMode && (
            <>
              <View style={[
                styles.explanation,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: selectedOptionIndex !== null &&
                    answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                      ? theme.colors.success
                      : theme.colors.error
                }
              ]}>
                <View style={styles.explanationHeader}>
                  <Ionicons
                    name={
                      selectedOptionIndex !== null &&
                      answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      selectedOptionIndex !== null &&
                      answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                        ? theme.colors.success
                        : theme.colors.error
                    }
                  />
                  <Text style={[
                    styles.explanationHeaderText,
                    {
                      color:
                        selectedOptionIndex !== null &&
                        answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                          ? theme.colors.success
                          : theme.colors.error
                    }
                  ]}>
                    {selectedOptionIndex !== null &&
                      answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                      ? "Correct!"
                      : "Incorrect!"
                    }
                  </Text>
                </View>
                <Text style={[styles.explanationText, { color: theme.colors.text }]}>{questionObject.explanation}</Text>
              </View>

              {/* Exam tip if available */}
              {questionObject.examTip && (
                <View style={[styles.examTip, { 
                  backgroundColor: theme.colors.warning + '10',
                  borderColor: theme.colors.warning
                }]}>
                  <View style={styles.examTipHeader}>
                    <Ionicons name="flash" size={20} color={theme.colors.warning} />
                    <Text style={[styles.examTipHeaderText, { color: theme.colors.warning }]}>Exam Tip</Text>
                  </View>
                  <Text style={[styles.examTipText, { color: theme.colors.text }]}>{questionObject.examTip}</Text>
                </View>
              )}
            </>
          )}
        </View>
        
        {/* Extra space at bottom for navigation buttons */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Navigation buttons (fixed position) */}
      {/* Previous button */}
      <TouchableOpacity
        style={[
          styles.navCircleButton,
          styles.prevCircleButton,
          {
            backgroundColor: currentQuestionIndex === 0 ? 
              theme.colors.surface + '80' : theme.colors.surface,
            shadowColor: theme.colors.shadow,
          }
        ]}
        onPress={handlePreviousQuestion}
        disabled={currentQuestionIndex === 0}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={currentQuestionIndex === 0 ? 
            theme.colors.text + '40' : theme.colors.text} 
        />
      </TouchableOpacity>

      {/* Next/Finish button */}
      <TouchableOpacity
        style={[
          styles.navCircleButton,
          styles.nextCircleButton,
          {
            backgroundColor: currentQuestionIndex === effectiveTotal - 1 ? 
              theme.colors.buttonDanger : theme.colors.primary,
            shadowColor: theme.colors.shadow,
          }
        ]}
        onPress={handleNextQuestion}
      >
        <Ionicons 
          name={currentQuestionIndex === effectiveTotal - 1 ? 
            "checkmark-done" : "chevron-forward"} 
          size={24} 
          color={theme.colors.buttonText} 
        />
      </TouchableOpacity>

      {/* Skip button */}
      <TouchableOpacity
        style={[
          styles.skipButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          }
        ]}
        onPress={skipQuestion}
      >
        <Ionicons name="play-skip-forward" size={18} color={theme.colors.textSecondary} />
        <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>SKIP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Top bar with user info
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userStats: {
    marginLeft: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  xpText: {
    fontSize: 12,
    marginLeft: 4,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coinsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  // Test number display
  testInfo: {
    alignItems: 'center',
  },
  testNumberBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  testNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restartTestButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  // Question controls
  questionControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    margin: 12,
    marginTop: 5,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  flagButton: {
    padding: 8,
    borderRadius: 8,
  },
  questionDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  questionDropdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  finishButton: {
    padding: 8,
    borderRadius: 8,
  },
  // Progress bar
  progressBarContainer: {
    height: 6,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
  },
  // Question content
  questionScrollView: {
    flex: 1,
  },
  questionContainer: {
    paddingVertical: 15,
  },
  questionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  questionTextContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  // Options
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  // Explanation
  explanation: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  explanationHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Exam tip
  examTip: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 15,
  },
  examTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTipHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  examTipText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Navigation buttons (fixed)
  navCircleButton: {
    position: 'absolute',
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  prevCircleButton: {
    left: 20,
  },
  nextCircleButton: {
    right: 20,
  },
  skipButton: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  skipButtonText: {
    fontSize: 13,
    marginLeft: 6,
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
    // Style via props
  },
  cancelButton: {
    // Style via props
  },
  modalButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Score modal
  scoreModalContent: {
    width: '90%',
    maxWidth: 500,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%',
  },
  scoreInfo: {
    flex: 1,
    marginRight: 20,
  },
  scoreText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
  scoreCircleContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    flexShrink: 0,
  },
  percentageDisplay: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gradeLabel: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  examModeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  examModeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  scoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    margin: 5,
    minWidth: '30%',
    flex: 1,
  },
  scoreButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    fontSize: 7,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Review modal
  reviewModalContent: {
    width: '95%',
    height: '90%',
    padding: 0,
  },
  reviewHeader: {
    padding: 15,
    borderBottomWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  closeReviewButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewScoreSummary: {
    fontSize: 14,
  },
  reviewFilters: {
    padding: 15,
    borderBottomWidth: 1,
    width: '100%',
  },
  reviewFiltersScroll: {
    paddingBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    marginLeft: 6,
  },
  filterCount: {
    fontSize: 12,
    marginTop: 10,
  },
  reviewList: {
    padding: 15,
  },
  reviewQuestionCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewQuestionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flaggedIcon: {
    marginLeft: 8,
  },
  reviewQuestionContent: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  answerSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  answerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  answerStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  yourAnswerText: {
    fontSize: 15,
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 15,
  },
  answerLabel: {
    fontWeight: 'bold',
  },
  explanationSection: {
    padding: 10,
    borderRadius: 8,
  },
  closeReviewButtonBottom: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 15,
  },
  closeReviewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Question dropdown
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: 15,
    alignItems: 'center',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownList: {
    maxHeight: '90%',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closeDropdownButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  closeDropdownText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Loading & Error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorMessage: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  errorButtons: {
    flexDirection: 'row',
  },
  errorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  errorBackButton: {
    borderWidth: 1,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorButtonTextBack: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestScreen;
