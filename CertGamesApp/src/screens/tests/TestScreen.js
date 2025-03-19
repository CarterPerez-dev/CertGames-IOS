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
  Image
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

// Replace all direct fetch calls with testService
import testService from '../../api/testService';

import { fetchShopItems } from '../../store/slices/shopSlice';
import { fetchAchievements } from '../../store/slices/achievementsSlice';

import FormattedQuestion from '../../components/FormattedQuestion';

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
  const { userId, xp, level, coins, xpBoost, currentAvatar } = useSelector(state => state.user);
  const { items: shopItems = [], status: shopStatus } = useSelector(state => state.shop || { items: [], status: 'idle' });
  const { all: achievements = [] } = useSelector(state => state.achievements || { all: [] });

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

  // Animation
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [localLevel, setLocalLevel] = useState(level);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  // Watch for level up
  useEffect(() => {
    if (level > localLevel) {
      setLocalLevel(level);
      setShowLevelUpAnimation(true);

      // Animate the level up message
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();

      // Hide the animation after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start(() => setShowLevelUpAnimation(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [level, localLevel, fadeAnim, slideAnim]);

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

        // Update current position (question index, etc.)
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
            dispatch({
              type: 'user/setXPAndCoins',
              payload: {
                xp: awardData.newXP,
                coins: awardData.newCoins
              }
            });
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
      testData,
      xpBoost,
      userId,
      testId,
      dispatch,
      score,
      answers,
      updateServerProgress,
      realIndex,
      answerOrder
    ]
  );

  // Finish the test
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
      // Replace direct fetch with testService.finishTestAttempt
      const finishData = await testService.finishTestAttempt(userId, testId, {
        score: finalScore,
        totalQuestions: effectiveTotal,
        testId,
        category
      });

      // Handle achievement unlocks
      if (finishData.newlyUnlocked && finishData.newlyUnlocked.length > 0) {
        console.log('New achievements unlocked:', finishData.newlyUnlocked);
      }

      // Update user XP and coins
      if (typeof finishData.newXP !== "undefined" && typeof finishData.newCoins !== "undefined") {
        dispatch({
          type: 'user/setXPAndCoins',
          payload: {
            xp: finishData.newXP,
            coins: finishData.newCoins,
            newlyUnlocked: finishData.newlyUnlocked || []
          }
        });
      }
    } catch (err) {
      console.error("Failed to finish test attempt:", err);
    }

    setShowScoreModal(true);
  }, [answers, userId, testId, effectiveTotal, dispatch, category]);

  // Navigation between questions
  const handleNextQuestion = useCallback(() => {
    if (!isAnswered && !examMode) {
      setShowWarningModal(true);
      return;
    }

    if (currentQuestionIndex === effectiveTotal - 1) {
      finishTestProcess();
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    updateServerProgress(answers, score, false);
  }, [
    isAnswered,
    examMode,
    currentQuestionIndex,
    effectiveTotal,
    finishTestProcess,
    updateServerProgress,
    answers,
    score
  ]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      updateServerProgress(answers, score, false);
    }
  }, [currentQuestionIndex, updateServerProgress, answers, score]);

  // Skip the current question
  const handleSkipQuestion = () => {
    if (!questionObject) return;

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

    updateServerProgress(updatedAnswers, score, false, skipObj);

    if (currentQuestionIndex === effectiveTotal - 1) {
      finishTestProcess();
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  // Flag the current question
  const handleFlagQuestion = () => {
    if (!questionObject) return;

    const qId = questionObject.id;
    if (flaggedQuestions.includes(qId)) {
      setFlaggedQuestions(flaggedQuestions.filter(x => x !== qId));
    } else {
      setFlaggedQuestions([...flaggedQuestions, qId]);
    }
  };

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

  // Render level up animation
  const renderLevelUpAnimation = () => {
    if (!showLevelUpAnimation) return null;

    return (
      <Animated.View
        style={[
          styles.levelUpOverlay,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.levelUpText}>
          LEVEL UP! You are now Level {level}
        </Text>
      </Animated.View>
    );
  };

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={30} color="#FFC107" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>No Answer Selected</Text>
            <Text style={styles.modalText}>
              You haven't answered this question yet. Please select an answer or skip the question.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={30} color="#FFC107" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Restart</Text>
            <Text style={styles.modalText}>
              Are you sure you want to restart the test? All progress will be lost and you'll start from the beginning.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowRestartModal(false);
                  handleRestartTest();
                }}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={30} color="#FFC107" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Finish</Text>
            <Text style={styles.modalText}>
              Are you sure you want to finish the test now? Any unanswered questions will be marked as skipped.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowFinishModal(false);
                  finishTestProcess();
                }}
              >
                <Text style={styles.modalButtonText}>Yes, Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFinishModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    let gradeClass = "";

    if (percentage >= 90) {
      grade = "Outstanding!";
      gradeClass = "gradeAPlus";
    } else if (percentage >= 80) {
      grade = "Excellent!";
      gradeClass = "gradeA";
    } else if (percentage >= 70) {
      grade = "Great Job!";
      gradeClass = "gradeB";
    } else if (percentage >= 60) {
      grade = "Good Effort!";
      gradeClass = "gradeC";
    } else {
      grade = "Keep Practicing!";
      gradeClass = "gradeD";
    }

    return (
      <Modal
        visible={showScoreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.scoreModalContent]}>
            <Text style={styles.scoreTitle}>Test Complete!</Text>

            <View style={styles.scoreGradeContainer}>
              <View style={[styles.scoreGrade, styles[gradeClass]]}>
                <Text style={styles.percentageDisplay}>{percentage}%</Text>
                <Text style={styles.gradeLabel}>{grade}</Text>
              </View>

              <View style={styles.scoreDetailsContainer}>
                <Text style={styles.scoreDetails}>
                  You answered <Text style={styles.scoreHighlight}>{score}</Text> out of <Text style={styles.scoreHighlight}>{effectiveTotal}</Text> questions correctly.
                </Text>

                {examMode && (
                  <View style={styles.examModeNote}>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                    <Text style={styles.examModeText}>You completed this test in exam mode!</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.scoreButtons}>
              <TouchableOpacity
                style={[styles.scoreButton, styles.restartScoreButton]}
                onPress={() => setShowRestartModal(true)}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.scoreButtonText}>Restart Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scoreButton, styles.reviewScoreButton]}
                onPress={handleReviewAnswers}
              >
                <Ionicons name="eye" size={18} color="#FFFFFF" />
                <Text style={styles.scoreButtonText}>Review Answers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scoreButton, styles.backScoreButton]}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                <Text style={styles.scoreButtonText}>Back to List</Text>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.reviewModalContent]}>
            <View style={styles.reviewHeader}>
              <TouchableOpacity
                style={styles.closeReviewButton}
                onPress={handleCloseReview}
              >
                <Ionicons name="close" size={24} color="#AAAAAA" />
              </TouchableOpacity>
              <Text style={styles.reviewTitle}>Review Mode</Text>

              {isFinished && (
                <Text style={styles.reviewScoreSummary}>
                  Your score: {score}/{effectiveTotal} ({effectiveTotal ? Math.round((score / effectiveTotal) * 100) : 0}%)
                </Text>
              )}
            </View>

            <View style={styles.reviewFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewFiltersScroll}>
                <TouchableOpacity
                  style={[styles.filterButton, reviewFilter === 'all' && styles.activeFilter]}
                  onPress={() => setReviewFilter('all')}
                >
                  <Ionicons name="list" size={18} color={reviewFilter === 'all' ? "#FFFFFF" : "#AAAAAA"} />
                  <Text style={[styles.filterButtonText, reviewFilter === 'all' && styles.activeFilterText]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, reviewFilter === 'skipped' && styles.activeFilter]}
                  onPress={() => setReviewFilter('skipped')}
                >
                  <Ionicons name="play-skip-forward" size={18} color={reviewFilter === 'skipped' ? "#FFFFFF" : "#AAAAAA"} />
                  <Text style={[styles.filterButtonText, reviewFilter === 'skipped' && styles.activeFilterText]}>Skipped</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, reviewFilter === 'flagged' && styles.activeFilter]}
                  onPress={() => setReviewFilter('flagged')}
                >
                  <Ionicons name="flag" size={18} color={reviewFilter === 'flagged' ? "#FFFFFF" : "#AAAAAA"} />
                  <Text style={[styles.filterButtonText, reviewFilter === 'flagged' && styles.activeFilterText]}>Flagged</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, reviewFilter === 'incorrect' && styles.activeFilter]}
                  onPress={() => setReviewFilter('incorrect')}
                >
                  <Ionicons name="close-circle" size={18} color={reviewFilter === 'incorrect' ? "#FFFFFF" : "#AAAAAA"} />
                  <Text style={[styles.filterButtonText, reviewFilter === 'incorrect' && styles.activeFilterText]}>Incorrect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, reviewFilter === 'correct' && styles.activeFilter]}
                  onPress={() => setReviewFilter('correct')}
                >
                  <Ionicons name="checkmark-circle" size={18} color={reviewFilter === 'correct' ? "#FFFFFF" : "#AAAAAA"} />
                  <Text style={[styles.filterButtonText, reviewFilter === 'correct' && styles.activeFilterText]}>Correct</Text>
                </TouchableOpacity>
              </ScrollView>

              <Text style={styles.filterCount}>
                Showing {filteredQuestions.length} questions
              </Text>
            </View>

            <FlatList
              data={filteredQuestions}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => {
                const userAns = answers.find(a => a.questionId === item.id);
                const isFlagged = flaggedQuestions.includes(item.id);

                // Determine answer status
                let answerStatus = { type: 'unanswered', label: 'Not Answered', color: '#FFC107', icon: 'alert' };

                if (userAns) {
                  const isSkipped = userAns.userAnswerIndex === null;
                  const isCorrect = userAns.userAnswerIndex === item.correctAnswerIndex;

                  if (isSkipped) {
                    answerStatus = { type: 'skipped', label: 'Skipped', color: '#FF9800', icon: 'play-skip-forward' };
                  } else if (isCorrect) {
                    answerStatus = { type: 'correct', label: 'Correct!', color: '#2EBB77', icon: 'checkmark-circle' };
                  } else {
                    answerStatus = { type: 'incorrect', label: 'Incorrect', color: '#FF4E4E', icon: 'close-circle' };
                  }
                }

                return (
                  <View style={[styles.reviewQuestionCard, styles[`${answerStatus.type}Card`]]}>
                    <View style={styles.reviewQuestionHeader}>
                      <Text style={styles.reviewQuestionNumber}>Question {index + 1}</Text>
                      {isFlagged && (
                        <Ionicons name="flag" size={18} color="#FFC107" style={styles.flaggedIcon} />
                      )}
                    </View>

                    <View style={styles.reviewQuestionContent}>
                      <FormattedQuestion questionText={item.question} />
                    </View>

                    <View style={[styles.answerSection, styles[`${answerStatus.type}Section`]]}>
                      <View style={styles.answerStatusRow}>
                        <Ionicons name={answerStatus.icon} size={20} color={answerStatus.color} />
                        <Text style={[styles.answerStatusText, { color: answerStatus.color }]}>
                          {answerStatus.label}
                        </Text>
                      </View>

                      {userAns && userAns.userAnswerIndex !== null && (
                        <Text style={styles.yourAnswerText}>
                          <Text style={styles.answerLabel}>Your Answer: </Text>
                          {item.options[userAns.userAnswerIndex]}
                        </Text>
                      )}

                      <Text style={styles.correctAnswerText}>
                        <Text style={styles.answerLabel}>Correct Answer: </Text>
                        {item.options[item.correctAnswerIndex]}
                      </Text>
                    </View>

                    <View style={styles.explanationSection}>
                      <Text style={styles.explanationText}>{item.explanation}</Text>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.reviewList}
            />

            {!isFinished && (
              <TouchableOpacity
                style={styles.closeReviewButtonBottom}
                onPress={handleCloseReview}
              >
                <Text style={styles.closeReviewButtonText}>Return to Test</Text>
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
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            <FlatList
              data={Array.from({ length: effectiveTotal }, (_, i) => i)}
              keyExtractor={item => item.toString()}
              renderItem={({ item: index }) => {
                const status = getQuestionStatus(index);

                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      index === currentQuestionIndex && styles.activeDropdownItem
                    ]}
                    onPress={() => handleQuestionSelect(index)}
                  >
                    <Text style={styles.dropdownItemText}>
                      Question {index + 1}
                    </Text>
                    <View style={styles.dropdownItemStatus}>
                      {status.isSkipped && (
                        <Ionicons name="play-skip-forward" size={18} color="#FF9800" />
                      )}
                      {status.isFlagged && (
                        <Ionicons name="flag" size={18} color="#FFC107" />
                      )}
                      {!examMode && status.isAnswered && !status.isSkipped && (
                        <Ionicons
                          name={status.isCorrect ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={status.isCorrect ? "#2EBB77" : "#FF4E4E"}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.dropdownList}
            />
            <TouchableOpacity
              style={styles.closeDropdownButton}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={styles.closeDropdownText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Show loading spinner while data is loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6543CC" />
        <Text style={styles.loadingText}>Loading test data...</Text>
      </View>
    );
  }

  // Show error screen if there's an error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#FF4E4E" />
        <Text style={styles.errorTitle}>Error Loading Test</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => fetchTestAndAttempt()}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorButton, styles.errorBackButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonTextBack}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show error if test data or questions are missing
  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#FF4E4E" />
        <Text style={styles.errorTitle}>No Questions Found</Text>
        <Text style={styles.errorMessage}>This test doesn't have any questions yet.</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Back to Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Level up animation */}
      {renderLevelUpAnimation()}

      {/* Modals */}
      {renderWarningModal()}
      {renderRestartModal()}
      {renderFinishModal()}
      {renderScoreModal()}
      {renderReviewMode()}
      {renderQuestionDropdown()}

      {/* Upper controls */}
      <View style={styles.topBar}>
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
            <View style={styles.levelBadge}>
              <Ionicons name="trophy" size={12} color="#FFFFFF" />
              <Text style={styles.levelText}>{level}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.xpDisplay}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.xpText}>{xp} XP</Text>
              </View>
              <View style={styles.coinsDisplay}>
                <Ionicons name="cash" size={12} color="#2EBB77" />
                <Text style={styles.coinsText}>{coins}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.testControls}>
          <TouchableOpacity
            style={styles.restartTestButton}
            onPress={() => setShowRestartModal(true)}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.testTitle}>{testData.testName}</Text>
        {examMode && (
          <View style={styles.examModeBadge}>
            <Ionicons name="trophy" size={14} color="#FFFFFF" />
            <Text style={styles.examModeText}>EXAM MODE</Text>
          </View>
        )}
      </View>

      {/* Question controls */}
      <View style={styles.questionControlBar}>
        <TouchableOpacity
          style={[
            styles.flagButton,
            questionObject && flaggedQuestions.includes(questionObject.id) && styles.flaggedButton
          ]}
          onPress={handleFlagQuestion}
        >
          <Ionicons
            name="flag"
            size={18}
            color={
              questionObject && flaggedQuestions.includes(questionObject.id)
                ? "#FFC107"
                : "#AAAAAA"
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.questionDropdownButton}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={styles.questionDropdownText}>
            Question {currentQuestionIndex + 1} of {effectiveTotal}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => setShowFinishModal(true)}
        >
          <Ionicons name="flag-checkered" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercentage}%`,
              backgroundColor: `hsl(${(progressPercentage * 120) / 100}, 100%, 50%)`
            }
          ]}
        />
      </View>

      {/* Question content */}
      <ScrollView style={styles.questionScrollView} contentContainerStyle={styles.questionContainer}>
        <View style={styles.questionCard}>
          {/* Question text */}
          <View style={styles.questionTextContainer}>
            {questionObject && (
              <FormattedQuestion questionText={questionObject.question} />
            )}
          </View>

          {/* Answer options */}
          <View style={styles.optionsContainer}>
            {displayedOptions.map((option, displayIdx) => {
              let optionStyle = [styles.optionButton];
              let textStyle = [styles.optionText];

              // Add styles based on answer status
              if (!examMode) {
                if (isAnswered && questionObject) {
                  const correctIndex = questionObject.correctAnswerIndex;
                  const actualIndex = answerOrder[realIndex][displayIdx];

                  if (actualIndex === correctIndex) {
                    optionStyle.push(styles.correctOption);
                    textStyle.push(styles.correctOptionText);
                  } else if (
                    displayIdx === selectedOptionIndex &&
                    actualIndex !== correctIndex
                  ) {
                    optionStyle.push(styles.incorrectOption);
                    textStyle.push(styles.incorrectOptionText);
                  }
                }
              } else {
                // In exam mode, just highlight the selected option
                if (isAnswered && displayIdx === selectedOptionIndex) {
                  optionStyle.push(styles.chosenOption);
                  textStyle.push(styles.chosenOptionText);
                }
              }

              const debugColors = ['red', 'blue', 'green', 'purple'];

              return (
                <TouchableOpacity
                  key={displayIdx}
                  style={[
                  styles.optionButton,
                  { backgroundColor: debugColors[displayIdx % debugColors.length] }
               ]}
                  onPress={() => handleOptionClick(displayIdx)}
                  disabled={examMode ? false : isAnswered}
                >
                  <View style={styles.optionLetter}>
                    <Text style={styles.optionLetterText}>
                      {String.fromCharCode(65 + displayIdx)}
                    </Text>
                  </View>
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
                selectedOptionIndex !== null &&
                answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                  ? styles.correctExplanation
                  : styles.incorrectExplanation
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
                        ? "#2EBB77"
                        : "#FF4E4E"
                    }
                  />
                  <Text style={[
                    styles.explanationHeaderText,
                    {
                      color:
                        selectedOptionIndex !== null &&
                        answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                          ? "#2EBB77"
                          : "#FF4E4E"
                    }
                  ]}>
                    {selectedOptionIndex !== null &&
                      answerOrder[realIndex][selectedOptionIndex] === questionObject.correctAnswerIndex
                      ? "Correct!"
                      : "Incorrect!"
                    }
                  </Text>
                </View>
                <Text style={styles.explanationText}>{questionObject.explanation}</Text>
              </View>

              {/* Exam tip if available */}
              {questionObject.examTip && (
                <View style={styles.examTip}>
                  <View style={styles.examTipHeader}>
                    <Ionicons name="flash" size={20} color="#FFC107" />
                    <Text style={styles.examTipHeaderText}>Exam Tip</Text>
                  </View>
                  <Text style={styles.examTipText}>{questionObject.examTip}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === effectiveTotal - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.finishNavButton]}
              onPress={handleNextQuestion}
            >
              <Ionicons name="flag-checkered" size={20} color="#FFFFFF" />
              <Text style={styles.navButtonText}>Finish Test</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNextQuestion}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipQuestion}
        >
          <Ionicons name="play-skip-forward" size={18} color="#FFFFFF" />
          <Text style={styles.skipButtonText}>Skip Question</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  // Top bar with user info
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#6543CC',
  },
  userStats: {
    marginLeft: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6543CC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  levelText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  xpText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coinsText: {
    color: '#2EBB77',
    fontSize: 12,
    marginLeft: 4,
  },
  testControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restartTestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  // Title bar
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6543CC',
    flex: 1,
  },
  examModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6543CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  examModeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // Question controls
  questionControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 15,
    marginTop: 0,
  },
  flagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  flaggedButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  questionDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6543CC',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  questionDropdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  finishButton: {
    backgroundColor: '#FF4E4E',
    padding: 8,
    borderRadius: 8,
  },
  // Progress bar
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6543CC',
  },
  // Question content
  questionScrollView: {
    flex: 1,
  },
  questionContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  questionTextContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 15,
  },
  // Options
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  optionLetter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    color: '#E2E2E2',
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  correctOption: {
    backgroundColor: 'rgba(46, 187, 119, 0.15)',
    borderColor: '#2EBB77',
  },
  incorrectOption: {
    backgroundColor: 'rgba(255, 78, 78, 0.15)',
    borderColor: '#FF4E4E',
  },
  chosenOption: {
    backgroundColor: 'rgba(101, 67, 204, 0.15)',
    borderColor: '#6543CC',
  },
  correctOptionText: {
    color: '#2EBB77',
    fontWeight: 'bold',
  },
  incorrectOptionText: {
    color: '#FF4E4E',
  },
  chosenOptionText: {
    color: '#6543CC',
    fontWeight: 'bold',
  },
  // Explanation
  explanation: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  correctExplanation: {
    borderColor: '#2EBB77',
    borderLeftWidth: 4,
  },
  incorrectExplanation: {
    borderColor: '#FF4E4E',
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
    color: '#E2E2E2',
    fontSize: 15,
    lineHeight: 22,
  },
  // Exam tip
  examTip: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
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
    color: '#FFC107',
    marginLeft: 8,
  },
  examTipText: {
    color: '#E2E2E2',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Navigation buttons
  navigationContainer: {
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  prevButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#6543CC',
    marginLeft: 8,
  },
  finishNavButton: {
    backgroundColor: '#FF4E4E',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  skipButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 8,
  },
  // Level up animation
  levelUpOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(101, 67, 204, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1000,
  },
  levelUpText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
  // Score modal
  scoreModalContent: {
    width: '90%',
    maxWidth: 500,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6543CC',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreGradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  scoreGrade: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  gradeAPlus: {
    backgroundColor: 'rgba(46, 187, 119, 0.2)',
    borderWidth: 3,
    borderColor: '#2EBB77',
  },
  gradeA: {
    backgroundColor: 'rgba(46, 187, 119, 0.2)',
    borderWidth: 3,
    borderColor: '#2EBB77',
  },
  gradeB: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderWidth: 3,
    borderColor: '#3498DB',
  },
  gradeC: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 3,
    borderColor: '#FFC107',
  },
  gradeD: {
    backgroundColor: 'rgba(255, 78, 78, 0.2)',
    borderWidth: 3,
    borderColor: '#FF4E4E',
  },
  percentageDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  scoreDetailsContainer: {
    flex: 1,
  },
  scoreDetails: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 10,
    lineHeight: 24,
  },
  scoreHighlight: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  examModeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  examModeText: {
    color: '#FFD700',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    margin: 5,
    minWidth: '30%',
    flex: 1,
  },
  restartScoreButton: {
    backgroundColor: '#6543CC',
  },
  reviewScoreButton: {
    backgroundColor: '#2EBB77',
  },
  backScoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    borderBottomColor: '#2A2A2A',
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
    color: '#FFFFFF',
    marginBottom: 5,
  },
  reviewScoreSummary: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  reviewFilters: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    width: '100%',
  },
  reviewFiltersScroll: {
    paddingBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#6543CC',
  },
  filterButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 6,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterCount: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 10,
  },
  reviewList: {
    padding: 15,
  },
  reviewQuestionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  unansweredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  skippedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  correctCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2EBB77',
  },
  incorrectCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF4E4E',
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
    color: '#FFFFFF',
  },
  flaggedIcon: {
    marginLeft: 8,
  },
  reviewQuestionContent: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  answerSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  unansweredSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
    padding: 10,
    borderRadius: 8,
  },
  skippedSection: {
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    padding: 10,
    borderRadius: 8,
  },
  correctSection: {
    backgroundColor: 'rgba(46, 187, 119, 0.05)',
    padding: 10,
    borderRadius: 8,
  },
  incorrectSection: {
    backgroundColor: 'rgba(255, 78, 78, 0.05)',
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
    color: '#E2E2E2',
    fontSize: 15,
    marginBottom: 8,
  },
  correctAnswerText: {
    color: '#E2E2E2',
    fontSize: 15,
  },
  answerLabel: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  explanationSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  closeReviewButtonBottom: {
    backgroundColor: '#6543CC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 15,
  },
  closeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Question dropdown
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
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
    borderBottomColor: '#2A2A2A',
  },
  activeDropdownItem: {
    backgroundColor: 'rgba(101, 67, 204, 0.2)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeDropdownButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#6543CC',
  },
  closeDropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Loading & Error states
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
  errorButtons: {
    flexDirection: 'row',
  },
  errorButton: {
    backgroundColor: '#6543CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  errorBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorButtonTextBack: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestScreen;
