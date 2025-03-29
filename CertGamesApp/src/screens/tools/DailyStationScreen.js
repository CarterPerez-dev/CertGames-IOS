// src/screens/tools/DailyStationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { claimDailyBonus, getDailyQuestion, submitDailyAnswer } from '../../api/dailyStationService';
import { setXPAndCoins, fetchUserData } from '../../store/slices/userSlice';
import FormattedQuestion from '../../components/FormattedQuestion';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import ErrorBoundaryScreen from '../../components/ErrorBoundaryScreen';

// Helper to safely format seconds as HH:MM:SS
function formatCountdown(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00:00";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}

// Helper to safely parse date
function safelyParseDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      // Validate it's not an invalid date
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // If it's anything else, return null
    return null;
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
}

const DailyStationScreen = ({ navigation }) => {
  console.log("DailyStationScreen rendering with direct Redux selectors");
  
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = theme ? createGlobalStyles(theme) : {};

  const dispatch = useDispatch();
  
  // Use direct Redux selectors instead of useUserData hook
  const userId = useSelector(state => state.user?.userId);
  const username = useSelector(state => state.user?.username);
  const coins = useSelector(state => state.user?.coins) || 0;
  const xp = useSelector(state => state.user?.xp) || 0;
  const lastDailyClaim = useSelector(state => state.user?.lastDailyClaim);
  const userStatus = useSelector(state => state.user?.status);
  
  console.log("UserData loaded directly:", { userId, coins, xp, lastDailyClaim: lastDailyClaim ? String(lastDailyClaim) : null });

  // Local states for bonus section
  const [bonusError, setBonusError] = useState(null);
  const [claimInProgress, setClaimInProgress] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [bonusCountdown, setBonusCountdown] = useState(24 * 3600); // 24 hours in seconds
  const [showButton, setShowButton] = useState(true);
  const [localLastClaim, setLocalLastClaim] = useState(null);
  const [showBonusMessage, setShowBonusMessage] = useState(false);

  // Local states for question section
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [questionCountdown, setQuestionCountdown] = useState(0);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);

  // Define a refreshData function since we're not using useUserData
  const refreshData = useCallback(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
    }
  }, [userId, dispatch]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("DailyStationScreen focused, userId:", userId);
      if (userId) {
        refreshData();
        fetchDailyQuestion();
      }
    }, [userId, refreshData])
  );

  // Check if user can claim bonus on initial load
  useEffect(() => {
    if (userId) {
      // Check if there's a recent claim from storage or server
      const checkStoredClaim = async () => {
        try {
          const storedLastClaim = await SecureStore.getItemAsync(`lastClaim_${userId}`);
          // Safely parse the date from server or storage
          const serverClaimDate = safelyParseDate(lastDailyClaim);
          const storedClaimDate = storedLastClaim ? safelyParseDate(storedLastClaim) : null;
          
          const lastClaimDate = serverClaimDate || storedClaimDate;
          
          if (lastClaimDate) {
            console.log("Using lastClaimDate:", lastClaimDate.toISOString());
            setLocalLastClaim(lastClaimDate);
            checkClaimStatus(lastClaimDate);
          } else {
            console.log("No valid lastClaimDate found, showing button");
            // No previous claim found, so show button
            setShowButton(true);
          }
        } catch (error) {
          console.error("Error checking stored claim:", error);
          // Default to showing button if there's an error
          setShowButton(true);
        }
      };
      
      checkStoredClaim();
    }
  }, [userId, lastDailyClaim]);

  // Check claim status helper function
  function checkClaimStatus(lastClaimDate) {
    try {
      if (!lastClaimDate || !(lastClaimDate instanceof Date) || isNaN(lastClaimDate.getTime())) {
        console.log("Invalid lastClaimDate in checkClaimStatus, showing button");
        setShowButton(true);
        return;
      }
      
      const now = new Date();
      const lastClaimTime = lastClaimDate.getTime();
      const diffMs = now - lastClaimTime;
      
      if (diffMs >= 24 * 60 * 60 * 1000) {
        // It's been 24 hours, show button
        setShowButton(true);
      } else {
        // Less than 24 hours, show countdown
        setShowButton(false);
        const secondsRemaining = Math.floor((24 * 60 * 60 * 1000 - diffMs) / 1000);
        setBonusCountdown(secondsRemaining);
      }
    } catch (error) {
      console.error("Error in checkClaimStatus:", error);
      // Default to showing button if there's an error
      setShowButton(true);
    }
  }

  // Bonus countdown logic (runs every second)
  useEffect(() => {
    if (!showButton && localLastClaim) {
      function tickBonus() {
        try {
          if (!localLastClaim || !(localLastClaim instanceof Date) || isNaN(localLastClaim.getTime())) {
            console.log("Invalid localLastClaim in tickBonus, showing button");
            setShowButton(true);
            return;
          }
          
          const now = new Date();
          const lastClaimTime = localLastClaim.getTime();
          const diffMs = now - lastClaimTime;
          
          if (diffMs >= 24 * 60 * 60 * 1000) {
            // It's been 24 hours, show button
            setShowButton(true);
            setBonusCountdown(0);
          } else {
            // Less than 24 hours, update countdown
            const secondsRemaining = Math.floor((24 * 60 * 60 * 1000 - diffMs) / 1000);
            setBonusCountdown(secondsRemaining);
          }
        } catch (error) {
          console.error("Error in tickBonus:", error);
          // Default to showing button if there's an error
          setShowButton(true);
        }
      }
      
      tickBonus(); // Run immediately
      const bonusInterval = setInterval(tickBonus, 1000);
      return () => clearInterval(bonusInterval);
    }
  }, [localLastClaim, showButton]);

  // Daily question refresh countdown logic
  useEffect(() => {
    function tickQuestion() {
      try {
        const now = new Date();
        const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diff = Math.floor((nextMidnightUTC - now) / 1000);
        setQuestionCountdown(diff > 0 ? diff : 0);
      } catch (error) {
        console.error("Error in tickQuestion:", error);
        setQuestionCountdown(0);
      }
    }
    
    tickQuestion(); // Run immediately
    const questionInterval = setInterval(tickQuestion, 1000);
    return () => clearInterval(questionInterval);
  }, []);

  // Fetch daily question if user is logged in
  useEffect(() => {
    if (userId) {
      fetchDailyQuestion();
    } else {
      setLoadingQuestion(false);
    }
  }, [userId]);

  // Handle bonus message display
  useEffect(() => {
    if (showBonusMessage) {
      const timer = setTimeout(() => {
        setShowBonusMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBonusMessage]);

  // Claim daily bonus
  const handleClaimDailyBonus = async () => {
    if (!userId) {
      setBonusError('Please log in first.');
      return;
    }
    
    // IMMEDIATELY hide button and show countdown to prevent double-clicks
    setShowButton(false);
    setClaimInProgress(true);
    setBonusError(null);
    
    // Set last claim time to now and store it in state
    const now = new Date();
    setLocalLastClaim(now);
    // Store in SecureStore for persistence
    try {
      await SecureStore.setItemAsync(`lastClaim_${userId}`, now.toISOString());
    } catch (error) {
      console.error("Error saving claim time:", error);
    }
    
    // Start the countdown immediately
    setBonusCountdown(24 * 60 * 60); // 24 hours in seconds
    
    try {
      // Make the API call
      const data = await claimDailyBonus(userId);
      
      setClaimInProgress(false);
      
      if (data && data.success) {
        // Show success message
        setShowBonusMessage(true);
        setClaimed(true);
        
        // Update user data immediately in Redux
        if (data.newCoins !== undefined && data.newXP !== undefined) {
          dispatch(setXPAndCoins({
            coins: data.newCoins,
            xp: data.newXP,
            newlyUnlocked: data.newlyUnlocked || []
          }));
        } else {
          // Fall back to fetching user data if direct values not available
          refreshData();
        }
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            .catch(err => console.log('Haptics error:', err));
        }
      } else {
        // Server says already claimed
        setBonusError(data?.message || 'Failed to claim bonus');
        // Don't change UI state - keep showing countdown
      }
    } catch (err) {
      setBonusError('Error: ' + (err?.message || 'Unknown error'));
      setClaimInProgress(false);
      // Even if there's an error, keep showing the countdown
    }
  };

  // Fetch daily question
  const fetchDailyQuestion = async () => {
    if (!userId) {
      setLoadingQuestion(false);
      return;
    }
    
    setLoadingQuestion(true);
    setQuestionError(null);
    
    try {
      const data = await getDailyQuestion(userId);
      setQuestionData(data);
      setLoadingQuestion(false);
    } catch (err) {
      console.error("Error fetching daily question:", err);
      setQuestionError('Error fetching daily question: ' + (err?.message || 'Unknown error'));
      setLoadingQuestion(false);
    }
  };

  // Submit daily answer
  const handleSubmitAnswer = async () => {
    if (!questionData || questionData.alreadyAnswered) {
      setQuestionError("You've already answered today's question!");
      return;
    }
    
    if (selectedAnswer === null) {
      setQuestionError('Please select an answer first.');
      return;
    }
    
    setQuestionError(null);
    
    try {
      const ansData = await submitDailyAnswer(userId, questionData.dayIndex, selectedAnswer);
      
      setSubmitResult(ansData);
      
      // Update user data immediately in Redux
      if (ansData && ansData.newCoins !== undefined && ansData.newXP !== undefined) {
        dispatch(setXPAndCoins({
          coins: ansData.newCoins,
          xp: ansData.newXP,
          newlyUnlocked: ansData.newlyUnlocked || []
        }));
      } else {
        // Fall back to refreshing data
        refreshData();
      }
      
      setQuestionData((prev) => ({
        ...prev,
        alreadyAnswered: true
      }));

      if (ansData && ansData.correct) {
        setShowCorrectFeedback(true);
        setTimeout(() => setShowCorrectFeedback(false), 2000);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            .catch(err => console.log('Haptics error:', err));
        }
      } else {
        setShowWrongFeedback(true);
        setTimeout(() => setShowWrongFeedback(false), 2000);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            .catch(err => console.log('Haptics error:', err));
        }
      }
    } catch (err) {
      setQuestionError('Error: ' + (err?.message || 'Unknown error'));
    }
  };

  // If user data is loading, show a loading screen
  if (userStatus === 'loading') {
    return (
      <View style={{
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme?.colors?.background || '#0B0C15'
      }}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || '#6A1B9A'} />
        <Text style={{
          color: theme?.colors?.text || '#FFFFFF',
          marginTop: 20
        }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundaryScreen screenName="Daily Station" navigation={navigation}>
      <SafeAreaView style={[globalStyles?.screen || {}, {flex: 1, backgroundColor: theme?.colors?.background || '#0B0C15'}]}>
        <ScrollView style={styles.scrollView}>
          {/* Header Section */}
          <View style={[styles.header, { backgroundColor: theme?.colors?.surface || '#121212', borderBottomColor: theme?.colors?.border || '#333333' }]}>
            <Text style={[globalStyles?.title || {}, styles.headerTitle, {color: theme?.colors?.text || '#FFFFFF'}]}>Daily Station</Text>
            <Text style={[globalStyles?.textSecondary || {}, styles.subtitle, {color: theme?.colors?.textSecondary || '#B0B0B0'}]}>
              Claim your daily rewards and answer the challenge
            </Text>
            
            {userId && (
              <View style={styles.userStats}>
                <View 
                  style={[
                    styles.statItem, 
                    { backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E' }
                  ]}
                >
                  <Ionicons name="cash" size={18} color={theme?.colors?.goldBadge || '#FFD700'} />
                  <Text style={[styles.statValue, { color: theme?.colors?.text || '#FFFFFF' }]}>
                    {coins !== undefined ? coins : 0}
                  </Text>
                </View>
                
                <View 
                  style={[
                    styles.statItem, 
                    { backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E' }
                  ]}
                >
                  <Ionicons name="star" size={18} color={theme?.colors?.primary || '#6A1B9A'} />
                  <Text style={[styles.statValue, { color: theme?.colors?.text || '#FFFFFF' }]}>
                    {xp !== undefined ? xp : 0}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Rest of your UI implementation (same as previous) */}
          
          {/* Main Content */}
          <View style={[globalStyles?.container || {}, styles.content]}>
            {!userId ? (
              <View style={[styles.loginRequired, { 
                backgroundColor: theme?.colors?.surface || '#121212',
                borderColor: theme?.colors?.border || '#333333'
              }]}>
                <Ionicons name="bulb" size={40} color={theme?.colors?.primary || '#6A1B9A'} style={styles.loginIcon} />
                <Text style={[globalStyles?.title || {}, styles.loginTitle, {color: theme?.colors?.text || '#FFFFFF'}]}>Login Required</Text>
                <Text style={[globalStyles?.text || {}, styles.loginText, {color: theme?.colors?.text || '#FFFFFF'}]}>
                  Please log in to claim daily rewards and participate in daily challenges.
                </Text>
              </View>
            ) : (
              <>
                {/* Daily Bonus Card */}
                <View style={[globalStyles?.card || {}, styles.card, {
                  borderColor: theme?.colors?.border || '#333333',
                  backgroundColor: theme?.colors?.surface || '#121212'
                }]}>
                  <LinearGradient
                    colors={theme?.colors?.secondaryGradient || ['#4527A0', '#311B92']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.cardHeader}
                  >
                    <Ionicons name="gift" size={20} color={theme?.colors?.text || '#FFFFFF'} />
                    <Text style={[styles.cardTitle, { color: theme?.colors?.text || '#FFFFFF' }]}>Daily Bonus</Text>
                  </LinearGradient>
                  
                  <View style={styles.cardContent}>
                    <View style={styles.bonusInfo}>
                      <View style={[styles.bonusValue, { 
                        backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                        borderColor: `${theme?.colors?.goldBadge || '#FFD700'}50` 
                      }]}>
                        <Ionicons name="cash" size={24} color={theme?.colors?.goldBadge || '#FFD700'} />
                        <Text style={[styles.bonusValueText, { color: theme?.colors?.text || '#FFFFFF' }]}>250</Text>
                      </View>
                      <Text style={[globalStyles?.textSecondary || {}, styles.bonusText, {color: theme?.colors?.textSecondary || '#B0B0B0'}]}>
                        Claim your free coins every 24 hours!
                      </Text>
                    </View>
                    
                    {/* Show error if any */}
                    {bonusError && !bonusError.includes("Next bonus in") && (
                      <View style={[globalStyles?.errorContainer || {}, styles.errorContainer]}>
                        <Ionicons name="alert-circle" size={20} color={theme?.colors?.error || '#E74C3C'} />
                        <Text style={[globalStyles?.errorText || {}, {color: theme?.colors?.error || '#E74C3C'}]}>
                          {bonusError}
                        </Text>
                      </View>
                    )}

                    {/* Show success message */}
                    {showBonusMessage && (
                      <View style={[styles.successMessage, { 
                        backgroundColor: `${theme?.colors?.success || '#2EBB77'}20`,
                        borderColor: theme?.colors?.success || '#2EBB77'
                      }]}>
                        <Ionicons name="checkmark-circle" size={20} color={theme?.colors?.success || '#2EBB77'} />
                        <Text style={[styles.successMessageText, { color: theme?.colors?.success || '#2EBB77' }]}>
                          Daily Bonus Claimed! +250 coins added
                        </Text>
                      </View>
                    )}
                    
                    {/* Claim Button or Countdown */}
                    <View style={styles.bonusAction}>
                      {showButton ? (
                        <TouchableOpacity 
                          style={[globalStyles?.buttonSecondary || {}, styles.claimButton, {
                            backgroundColor: theme?.colors?.secondary || '#4527A0',
                          }]}
                          onPress={handleClaimDailyBonus}
                          disabled={claimInProgress}
                        >
                          {claimInProgress ? (
                            <View style={styles.buttonContent}>
                              <ActivityIndicator size="small" color={theme?.colors?.buttonText || '#FFFFFF'} />
                              <Text style={[globalStyles?.buttonText || {}, styles.buttonText, {color: theme?.colors?.buttonText || '#FFFFFF'}]}>
                                Claiming...
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.buttonContent}>
                              <Ionicons name="cash" size={20} color={theme?.colors?.buttonText || '#FFFFFF'} />
                              <Text style={[globalStyles?.buttonText || {}, styles.buttonText, {color: theme?.colors?.buttonText || '#FFFFFF'}]}>
                                Claim Bonus
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.countdown, { 
                          backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                          borderColor: theme?.colors?.border || '#333333' 
                        }]}>
                          <Ionicons name="hourglass" size={24} color={theme?.colors?.primary || '#6A1B9A'} />
                          <View style={styles.countdownInfo}>
                            <Text style={[globalStyles?.textMuted || {}, styles.countdownLabel, {color: theme?.colors?.textMuted || '#808080'}]}>
                              Next bonus in:
                            </Text>
                            <Text style={[styles.countdownTime, { 
                              color: theme?.colors?.text || '#FFFFFF', 
                              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
                            }]}>
                              {formatCountdown(bonusCountdown)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Daily Question Card */}
                <View style={[globalStyles?.card || {}, styles.card, {
                  borderColor: theme?.colors?.border || '#333333',
                  backgroundColor: theme?.colors?.surface || '#121212'
                }]}>
                  <LinearGradient
                    colors={theme?.colors?.primaryGradient || ['#6A1B9A', '#4527A0']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.cardHeader}
                  >
                    <Ionicons name="bulb" size={20} color={theme?.colors?.text || '#FFFFFF'} />
                    <Text style={[styles.cardTitle, { color: theme?.colors?.text || '#FFFFFF' }]}>Daily Challenge</Text>
                  </LinearGradient>
                  
                  <View style={styles.cardContent}>
                    {loadingQuestion ? (
                      <View style={styles.loading}>
                        <ActivityIndicator size="large" color={theme?.colors?.primary || '#6A1B9A'} />
                        <Text style={[globalStyles?.textMuted || {}, styles.loadingText, {color: theme?.colors?.textMuted || '#808080'}]}>
                          Loading challenge...
                        </Text>
                      </View>
                    ) : questionError ? (
                      <View style={[globalStyles?.errorContainer || {}, styles.errorContainer]}>
                        <Ionicons name="alert-circle" size={20} color={theme?.colors?.error || '#E74C3C'} />
                        <Text style={[globalStyles?.errorText || {}, {color: theme?.colors?.error || '#E74C3C'}]}>
                          {questionError}
                        </Text>
                      </View>
                    ) : !questionData ? (
                      <View style={styles.emptyState}>
                        <Text style={[globalStyles?.textMuted || {}, styles.emptyText, {color: theme?.colors?.textMuted || '#808080'}]}>
                          No challenges available today. Check back tomorrow!
                        </Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.question,
                        showCorrectFeedback && { borderColor: theme?.colors?.success || '#2EBB77', borderWidth: 1 },
                        showWrongFeedback && { borderColor: theme?.colors?.error || '#E74C3C', borderWidth: 1 }
                      ]}>
                        <View style={[styles.questionPrompt, { 
                          backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                          borderColor: theme?.colors?.border || '#333333' 
                        }]}>
                          {questionData.prompt && <FormattedQuestion questionText={questionData.prompt} />}
                        </View>
                        
                        {questionData.alreadyAnswered ? (
                          <View style={styles.questionAnswered}>
                            {submitResult && (
                              <View style={[
                                styles.resultContainer,
                                submitResult.correct ? 
                                  { backgroundColor: `${theme?.colors?.success || '#2EBB77'}20`, borderColor: theme?.colors?.success || '#2EBB77' } : 
                                  { backgroundColor: `${theme?.colors?.error || '#E74C3C'}20`, borderColor: theme?.colors?.error || '#E74C3C' }
                              ]}>
                                <Ionicons 
                                  name={submitResult.correct ? "checkmark-circle" : "close-circle"} 
                                  size={24} 
                                  color={submitResult.correct ? theme?.colors?.success || '#2EBB77' : theme?.colors?.error || '#E74C3C'} 
                                />
                                <Text style={[globalStyles?.text || {}, styles.resultText, {color: theme?.colors?.text || '#FFFFFF'}]}>
                                  {submitResult.correct ? 
                                    `Correct! You earned ${submitResult.awardedCoins} coins.` : 
                                    `Not quite, but you still got ${submitResult.awardedCoins} coins.`}
                                </Text>
                              </View>
                            )}
                            
                            {/* Explanation Section */}
                            {(questionData.explanation || (submitResult && submitResult.explanation)) && (
                              <View style={[styles.explanation, { 
                                backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                                borderColor: theme?.colors?.border || '#333333',
                                borderLeftColor: theme?.colors?.primary || '#6A1B9A'
                              }]}>
                                <Text style={[globalStyles?.text || {}, { fontWeight: '600' }, styles.explanationTitle, {color: theme?.colors?.text || '#FFFFFF'}]}>
                                  Explanation:
                                </Text>
                                <FormattedQuestion questionText={questionData.explanation || (submitResult && submitResult.explanation)} />
                              </View>
                            )}
                            
                            <View style={styles.nextQuestion}>
                              <View style={[styles.countdown, { 
                                backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                                borderColor: theme?.colors?.border || '#333333' 
                              }]}>
                                <Ionicons name="calendar" size={24} color={theme?.colors?.primary || '#6A1B9A'} />
                                <View style={styles.countdownInfo}>
                                  <Text style={[globalStyles?.textMuted || {}, styles.countdownLabel, {color: theme?.colors?.textMuted || '#808080'}]}>
                                    Next challenge in:
                                  </Text>
                                  <Text style={[styles.countdownTime, { 
                                    color: theme?.colors?.text || '#FFFFFF', 
                                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
                                  }]}>
                                    {formatCountdown(questionCountdown)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.questionOptions}>
                            {questionData.options && Array.isArray(questionData.options) && questionData.options.map((option, index) => (
                              <TouchableOpacity 
                                key={index}
                                style={[
                                  styles.optionItem,
                                  { 
                                    backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                                    borderColor: theme?.colors?.border || '#333333' 
                                  },
                                  selectedAnswer === index && { 
                                    backgroundColor: `${theme?.colors?.primary || '#6A1B9A'}30`, 
                                    borderColor: theme?.colors?.primary || '#6A1B9A' 
                                  }
                                ]}
                                onPress={() => setSelectedAnswer(index)}
                              >
                                <Text style={[
                                  globalStyles?.text || {},
                                  styles.optionText,
                                  { color: theme?.colors?.text || '#FFFFFF' },
                                  selectedAnswer === index && { fontWeight: '600' }
                                ]}>
                                  {option}
                                </Text>
                                {selectedAnswer === index && (
                                  <Ionicons name="chevron-forward" size={18} color={theme?.colors?.primary || '#6A1B9A'} style={styles.optionIcon} />
                                )}
                              </TouchableOpacity>
                            ))}
                            
                            <TouchableOpacity 
                              style={[
                                globalStyles?.buttonPrimary || {},
                                styles.submitButton,
                                { backgroundColor: theme?.colors?.primary || '#6A1B9A' },
                                selectedAnswer === null && { 
                                  backgroundColor: `${theme?.colors?.primary || '#6A1B9A'}80`,
                                }
                              ]}
                              onPress={handleSubmitAnswer}
                              disabled={selectedAnswer === null}
                            >
                              <Text style={[globalStyles?.buttonText || {}, {color: theme?.colors?.buttonText || '#FFFFFF'}]}>
                                Submit Answer
                              </Text>
                            </TouchableOpacity>
                            
                            <View style={styles.nextQuestion}>
                              <View style={[styles.countdown, { 
                                backgroundColor: theme?.colors?.surfaceHighlight || '#1E1E1E', 
                                borderColor: theme?.colors?.border || '#333333' 
                              }]}>
                                <Ionicons name="calendar" size={24} color={theme?.colors?.primary || '#6A1B9A'} />
                                <View style={styles.countdownInfo}>
                                  <Text style={[globalStyles?.textMuted || {}, styles.countdownLabel, {color: theme?.colors?.textMuted || '#808080'}]}>
                                    Challenge refreshes in:
                                  </Text>
                                  <Text style={[styles.countdownTime, { 
                                    color: theme?.colors?.text || '#FFFFFF', 
                                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
                                  }]}>
                                    {formatCountdown(questionCountdown)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundaryScreen>
  );
};

const styles = StyleSheet.create({
  // Styles remain the same...
  scrollView: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, marginBottom: 5 },
  subtitle: { fontSize: 14, marginBottom: 15 },
  userStats: { flexDirection: 'row', marginTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12, marginRight: 10 },
  statValue: { marginLeft: 6, fontWeight: '600' },
  content: { padding: 20 },
  loginRequired: { borderRadius: 15, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  loginIcon: { marginBottom: 15 },
  loginTitle: { fontSize: 20, marginBottom: 10 },
  loginText: { textAlign: 'center', lineHeight: 22 },
  // ...rest of styles from the previous version
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 20,
  },
  bonusInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bonusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
  },
  bonusValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bonusText: {
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
  },
  successMessageText: {
    marginLeft: 10,
    fontWeight: '600',
  },
  bonusAction: {
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  countdownInfo: {
    marginLeft: 10,
  },
  countdownLabel: {
    fontSize: 12,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
  },
  question: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  questionPrompt: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  questionOptions: {
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
  },
  optionIcon: {
    marginLeft: 10,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 20,
  },
  nextQuestion: {
    alignItems: 'center',
  },
  questionAnswered: {
    padding: 5,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  resultText: {
    marginLeft: 10,
    flex: 1,
  },
  explanation: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  explanationTitle: {
    marginBottom: 10,
  },
});

export default DailyStationScreen;
