// src/hooks/useTest.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as testService from '../api/testService';

/**
 * Custom hook for test-related functionality
 * 
 * @param {Object} options - Hook options
 * @param {string} [options.category] - Test category
 * @param {string|number} [options.testId] - Test ID
 * @param {boolean} [options.initialExamMode] - Initial exam mode state
 * @param {boolean} [options.isReview] - Whether in review mode
 * @returns {Object} Test methods and state
 */
const useTest = ({ 
  category, 
  testId, 
  initialExamMode,
  isReview = false
} = {}) => {
  const { userId, xpBoost } = useSelector(state => state.user);
  
  // Test state
  const [testData, setTestData] = useState(null);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  
  // UI state
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  
  // Test configuration
  const [examMode, setExamMode] = useState(initialExamMode || false);
  const [activeTestLength, setActiveTestLength] = useState(100);
  
  // Helper function to shuffle an array
  const shuffleArray = useCallback((arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);
  
  // Helper function to generate shuffled indices
  const shuffleIndices = useCallback((length) => {
    const indices = Array.from({ length }, (_, i) => i);
    return shuffleArray(indices);
  }, [shuffleArray]);
  
  // Get the real index based on shuffle order
  const getShuffledIndex = useCallback((index) => {
    if (!shuffleOrder || shuffleOrder.length === 0) return index;
    return shuffleOrder[index];
  }, [shuffleOrder]);
  
  // Current question based on shuffled index
  const currentQuestion = useMemo(() => {
    if (!testData || !testData.questions || testData.questions.length === 0) return null;
    const realIndex = getShuffledIndex(currentQuestionIndex);
    return testData.questions[realIndex];
  }, [testData, currentQuestionIndex, getShuffledIndex]);
  
  // Get current options for display
  const currentOptions = useMemo(() => {
    if (!currentQuestion || !answerOrder[getShuffledIndex(currentQuestionIndex)]) return [];
    
    return answerOrder[getShuffledIndex(currentQuestionIndex)].map(
      optionIdx => currentQuestion.options[optionIdx]
    );
  }, [currentQuestion, answerOrder, getShuffledIndex, currentQuestionIndex]);
  
  // Load test data and attempt
  const loadTest = useCallback(async () => {
    if (!category || !testId || !userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      let attemptDoc = null;
      
      // If reviewing, get finished attempt
      if (isReview) {
        const attemptRes = await testService.fetchTestAttempt(userId, testId, 'finished');
        attemptDoc = attemptRes.attempt;
      } 
      // Otherwise check for unfinished attempt first
      else {
        const unfinishedRes = await testService.fetchTestAttempt(userId, testId, 'unfinished');
        
        if (unfinishedRes.attempt) {
          attemptDoc = unfinishedRes.attempt;
        } else {
          // If no unfinished attempt, check for finished (for resuming)
          const finishedRes = await testService.fetchTestAttempt(userId, testId);
          attemptDoc = finishedRes.attempt;
        }
      }
      
      // Fetch test data
      const testDoc = await testService.fetchTestById(category, testId);
      setTestData(testDoc);
      
      const totalQ = testDoc.questions.length;
      
      // Process attempt if it exists
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
        
        // Use saved shuffle order if valid
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
          
          // Save immediately if not reviewing
          if (!isReview) {
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
        
        // Use saved answer order if valid
        if (
          attemptDoc.answerOrder &&
          Array.isArray(attemptDoc.answerOrder) &&
          attemptDoc.answerOrder.length === chosenLength
        ) {
          setAnswerOrder(attemptDoc.answerOrder);
        } else {
          // Create new answer order
          const newAnswerOrder = testDoc.questions
            .slice(0, chosenLength)
            .map(q => {
              const numOptions = q.options.length;
              return shuffleArray(Array.from({ length: numOptions }, (_, i) => i));
            });
            
          setAnswerOrder(newAnswerOrder);
          
          // Save immediately if not reviewing
          if (!isReview) {
            await testService.createOrUpdateAttempt(userId, testId, {
              category,
              answers: attemptDoc.answers || [],
              score: attemptDoc.score || 0,
              totalQuestions: totalQ,
              selectedLength: chosenLength,
              currentQuestionIndex: attemptDoc.currentQuestionIndex || 0,
              shuffleOrder: attemptDoc.shuffleOrder || [],
              answerOrder: newAnswerOrder,
              finished: attemptDoc.finished === true,
              examMode: attemptExam
            });
          }
        }
        
        setCurrentQuestionIndex(attemptDoc.currentQuestionIndex || 0);
      } else {
        // No attempt exists - this should be handled by the UI to create a new attempt
        setActiveTestLength(100); // Default
        setError('No test attempt found. Please create a new attempt.');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading test:', err);
      setError(err.message || 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  }, [
    userId, 
    testId, 
    category, 
    isReview, 
    shuffleIndices, 
    shuffleArray
  ]);
  
  // Load test when params change
  useEffect(() => {
    if (userId && testId && category) {
      loadTest();
    }
  }, [loadTest, userId, testId, category]);
  
  // Create a new test attempt with selected length
  const createNewAttempt = useCallback(async (selectedLength) => {
    if (!userId || !testId || !category || !testData) {
      return { success: false, message: 'Missing required data' };
    }
    
    try {
      const totalQ = testData.questions.length;
      
      // Generate shuffle orders
      const newQOrder = shuffleIndices(selectedLength);
      const newAnswerOrder = testData.questions
        .slice(0, selectedLength)
        .map(q => {
          const numOptions = q.options.length;
          return shuffleArray(Array.from({ length: numOptions }, (_, i) => i));
        });
        
      // Update state
      setShuffleOrder(newQOrder);
      setAnswerOrder(newAnswerOrder);
      setActiveTestLength(selectedLength);
      setScore(0);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setIsFinished(false);
      
      // Create attempt on server
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
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create new attempt:', error);
      setError('Failed to create new attempt');
      return { success: false, message: error.message || 'Failed to create attempt' };
    }
  }, [userId, testId, category, testData, examMode, shuffleIndices, shuffleArray]);
  
  // Restart the test with the same length
  const restartTest = useCallback(async () => {
    return await createNewAttempt(activeTestLength);
  }, [createNewAttempt, activeTestLength]);
  
  // Update the server with current progress
  const updateProgress = useCallback(async (updatedAnswers, updatedScore, finished = false, singleAnswer = null) => {
    if (!userId || !testId) return null;
    
    try {
      let result = null;
      
      if (singleAnswer) {
        result = await testService.submitAnswer(userId, {
          testId,
          questionId: singleAnswer.questionId,
          correctAnswerIndex: singleAnswer.correctAnswerIndex,
          selectedIndex: singleAnswer.userAnswerIndex,
          xpPerCorrect: (testData?.xpPerCorrect || 10) * xpBoost,
          coinsPerCorrect: 5
        });
        
        // For exam mode, also update the full attempt
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
      } else {
        // Update position data
        await testService.updatePosition(userId, testId, {
          currentQuestionIndex,
          finished
        });
        
        // Update full attempt data
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
      
      return result;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return null;
    }
  }, [
    userId, 
    testId, 
    examMode, 
    testData, 
    xpBoost, 
    category, 
    activeTestLength, 
    currentQuestionIndex, 
    shuffleOrder, 
    answerOrder
  ]);
  
  // Handle option selection
  const selectOption = useCallback(async (displayOptionIndex) => {
    if (!currentQuestion) return { success: false, message: 'No current question' };
    if (!examMode && isAnswered) return { success: false, message: 'Already answered' };
    
    const realIndex = getShuffledIndex(currentQuestionIndex);
    const actualAnswerIndex = answerOrder[realIndex][displayOptionIndex];
    
    setSelectedOptionIndex(displayOptionIndex);
    setIsAnswered(true);
    
    try {
      const newAnswerObj = {
        questionId: currentQuestion.id,
        userAnswerIndex: actualAnswerIndex,
        correctAnswerIndex: currentQuestion.correctAnswerIndex
      };
      
      const updatedAnswers = [...answers];
      const idx = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
      
      if (idx >= 0) {
        updatedAnswers[idx] = newAnswerObj;
      } else {
        updatedAnswers.push(newAnswerObj);
      }
      
      setAnswers(updatedAnswers);
      
      // Update progress on server
      const result = await updateProgress(updatedAnswers, score, false, newAnswerObj);
      
      // Update score for non-exam mode
      if (!examMode && result && result.examMode === false) {
        if (result.isCorrect) {
          setScore(prev => prev + 1);
        }
        
        return { 
          success: true, 
          isCorrect: result.isCorrect, 
          alreadyCorrect: result.alreadyCorrect,
          awardedXP: result.awardedXP,
          awardedCoins: result.awardedCoins
        };
      }
      
      return { success: true, examMode: true };
    } catch (error) {
      console.error('Error selecting option:', error);
      return { success: false, message: error.message };
    }
  }, [
    currentQuestion, 
    examMode, 
    isAnswered, 
    getShuffledIndex, 
    currentQuestionIndex, 
    answerOrder, 
    answers, 
    score, 
    updateProgress
  ]);
  
  // Skip the current question
  const skipQuestion = useCallback(async () => {
    if (!currentQuestion) return false;
    
    const updatedAnswers = [...answers];
    const idx = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
    
    const skipObj = {
      questionId: currentQuestion.id,
      userAnswerIndex: null,
      correctAnswerIndex: currentQuestion.correctAnswerIndex
    };
    
    if (idx >= 0) {
      updatedAnswers[idx] = skipObj;
    } else {
      updatedAnswers.push(skipObj);
    }
    
    setAnswers(updatedAnswers);
    setIsAnswered(false);
    setSelectedOptionIndex(null);
    
    await updateProgress(updatedAnswers, score, false, skipObj);
    
    // If this is the last question, finish the test
    if (currentQuestionIndex === activeTestLength - 1) {
      return await finishTest();
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    return true;
  }, [
    currentQuestion, 
    answers, 
    score, 
    updateProgress, 
    currentQuestionIndex, 
    activeTestLength
  ]);
  
  // Navigate to the next question
  const nextQuestion = useCallback(async () => {
    if (!isAnswered && !examMode) {
      return { success: false, message: 'Please answer or skip the question' };
    }
    
    // If this is the last question, finish the test
    if (currentQuestionIndex === activeTestLength - 1) {
      return await finishTest();
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    await updateProgress(answers, score, false);
    return { success: true };
  }, [
    isAnswered, 
    examMode, 
    currentQuestionIndex, 
    activeTestLength, 
    answers, 
    score, 
    updateProgress
  ]);
  
  // Navigate to the previous question
  const previousQuestion = useCallback(async () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      await updateProgress(answers, score, false);
      return true;
    }
    return false;
  }, [currentQuestionIndex, answers, score, updateProgress]);
  
  // Toggle flag on the current question
  const toggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    
    const qId = currentQuestion.id;
    if (flaggedQuestions.includes(qId)) {
      setFlaggedQuestions(prev => prev.filter(id => id !== qId));
    } else {
      setFlaggedQuestions(prev => [...prev, qId]);
    }
  }, [currentQuestion, flaggedQuestions]);
  
  // Finish the test
  const finishTest = useCallback(async () => {
    // Calculate final score
    let finalScore = 0;
    answers.forEach(ans => {
      if (ans.userAnswerIndex === ans.correctAnswerIndex) {
        finalScore++;
      }
    });
    
    setScore(finalScore);
    setIsFinished(true);
    
    try {
      const result = await testService.finishTestAttempt(userId, testId, {
        score: finalScore,
        totalQuestions: activeTestLength,
        testId,
        category
      });
      
      return {
        success: true,
        score: finalScore,
        totalQuestions: activeTestLength,
        percentage: Math.round((finalScore / activeTestLength) * 100),
        newlyUnlocked: result.newlyUnlocked || [],
        newXP: result.newXP,
        newCoins: result.newCoins
      };
    } catch (error) {
      console.error('Error finishing test:', error);
      return { success: false, message: error.message };
    }
  }, [userId, testId, answers, activeTestLength, category]);
  
  // Set exam mode (and save to storage)
  const setExamModeWithSave = useCallback(async (value) => {
    setExamMode(value);
    await SecureStore.setItemAsync('examMode', value ? 'true' : 'false');
  }, []);
  
  // Load exam mode from storage
  const loadExamMode = useCallback(async () => {
    try {
      const storedMode = await SecureStore.getItemAsync('examMode');
      setExamMode(storedMode === 'true');
    } catch (err) {
      console.error('Error loading exam mode:', err);
    }
  }, []);
  
  return {
    // State
    testData,
    currentQuestion,
    currentOptions,
    shuffleOrder,
    answerOrder,
    currentQuestionIndex,
    answers,
    score,
    loading,
    error,
    flaggedQuestions,
    isAnswered,
    selectedOptionIndex,
    isFinished,
    examMode,
    activeTestLength,
    
    // Derived values
    effectiveTotal: activeTestLength || (testData?.questions?.length || 0),
    progressPercentage: activeTestLength ? Math.round(((currentQuestionIndex + 1) / activeTestLength) * 100) : 0,
    
    // Methods
    loadTest,
    createNewAttempt,
    restartTest,
    selectOption,
    skipQuestion,
    nextQuestion,
    previousQuestion,
    toggleFlag,
    finishTest,
    setExamMode: setExamModeWithSave,
    loadExamMode,
    getShuffledIndex
  };
};

export default useTest;
