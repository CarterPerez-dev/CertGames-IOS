// src/screens/tools/DailyStationScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Modal,
  Animated
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { claimDailyBonus, getDailyQuestion, submitDailyAnswer } from '../../api/dailyStationService';
import { setXPAndCoins } from '../../store/slices/userSlice';
import FormattedQuestion from '../../components/FormattedQuestion';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import useUserData from '../../hooks/useUserData';

// Helper to format seconds as HH:MM:SS
function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}

const DailyStationScreen = () => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  const dispatch = useDispatch();
  
  // Use our custom hook for user data - this will ensure it's always up-to-date
  const { 
    userId, 
    username, 
    coins, 
    xp, 
    lastDailyClaim,
    refreshData 
  } = useUserData();

  // Store previous values for animations
  const prevCoinsRef = useRef(coins);
  const prevXpRef = useRef(xp);

  // Local states for bonus section
  const [bonusError, setBonusError] = useState(null);
  const [claimInProgress, setClaimInProgress] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [bonusCountdown, setBonusCountdown] = useState(24 * 3600); // 24 hours in seconds
  const [showButton, setShowButton] = useState(true);
  const [localLastClaim, setLocalLastClaim] = useState(null);
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);

  // Local states for question section
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [questionCountdown, setQuestionCountdown] = useState(0);
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [showWrongAnimation, setShowWrongAnimation] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinsFlashAnim = useRef(new Animated.Value(0)).current;
  const xpFlashAnim = useRef(new Animated.Value(0)).current;

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refreshData();
        fetchDailyQuestion();
      }
    }, [userId, refreshData])
  );

  // Animate coins changes
  useEffect(() => {
    if (coins > prevCoinsRef.current) {
      Animated.sequence([
        Animated.timing(coinsFlashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(coinsFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    // Update ref for next comparison
    prevCoinsRef.current = coins;
  }, [coins, coinsFlashAnim]);

  // Animate XP changes
  useEffect(() => {
    if (xp > prevXpRef.current) {
      Animated.sequence([
        Animated.timing(xpFlashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(xpFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
    
    // Update ref for next comparison
    prevXpRef.current = xp;
  }, [xp, xpFlashAnim]);

  // Check if user can claim bonus on initial load
  useEffect(() => {
    if (userId) {
      // Check if there's a recent claim from storage or server
      const checkStoredClaim = async () => {
        try {
          const storedLastClaim = await SecureStore.getItemAsync(`lastClaim_${userId}`);
          const serverLastClaim = lastDailyClaim;
          
          const lastClaimDate = serverLastClaim || (storedLastClaim ? new Date(storedLastClaim) : null);
          
          if (lastClaimDate) {
            setLocalLastClaim(lastClaimDate);
            checkClaimStatus(lastClaimDate);
          } else {
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
    const now = new Date();
    const lastClaimTime = new Date(lastClaimDate).getTime();
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
  }

  // Bonus countdown logic (runs every second)
  useEffect(() => {
    if (!showButton && localLastClaim) {
      function tickBonus() {
        const now = new Date();
        const lastClaimTime = new Date(localLastClaim).getTime();
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
      }
      
      tickBonus(); // Run immediately
      const bonusInterval = setInterval(tickBonus, 1000);
      return () => clearInterval(bonusInterval);
    }
  }, [localLastClaim, showButton]);

  // Daily question refresh countdown logic
  useEffect(() => {
    function tickQuestion() {
      const now = new Date();
      const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = Math.floor((nextMidnightUTC - now) / 1000);
      setQuestionCountdown(diff);
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

  // Handle bonus animation
  useEffect(() => {
    if (showBonusAnimation) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        setShowBonusAnimation(false);
      });
    } else {
      fadeAnim.setValue(0);
    }
  }, [showBonusAnimation, fadeAnim]);

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
      
      if (data.success) {
        // Show success animation
        setShowBonusAnimation(true);
        setClaimed(true);
        
        // Update user data immediately in Redux
        if (data.newCoins && data.newXP) {
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Server says already claimed
        setBonusError(data.message);
        // Don't change UI state - keep showing countdown
      }
    } catch (err) {
      setBonusError('Error: ' + err.message);
      setClaimInProgress(false);
      // Even if there's an error, keep showing the countdown
    }
  };

  // Fetch daily question
  const fetchDailyQuestion = async () => {
    setLoadingQuestion(true);
    setQuestionError(null);
    
    try {
      const data = await getDailyQuestion(userId);
      setQuestionData(data);
      setLoadingQuestion(false);
    } catch (err) {
      setQuestionError('Error fetching daily question: ' + err.message);
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
      if (ansData.newCoins && ansData.newXP) {
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

      if (ansData.correct) {
        setShowCorrectAnimation(true);
        setTimeout(() => setShowCorrectAnimation(false), 2000);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setShowWrongAnimation(true);
        setTimeout(() => setShowWrongAnimation(false), 2000);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      setQuestionError('Error: ' + err.message);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[globalStyles.title, styles.headerTitle]}>Daily Station</Text>
          <Text style={[globalStyles.textSecondary, styles.subtitle]}>Claim your daily rewards and answer the challenge</Text>
          
          {userId && (
            <View style={styles.userStats}>
              <Animated.View 
                style={[
                  styles.statItem, 
                  { 
                    backgroundColor: coinsFlashAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [theme.colors.surfaceHighlight, theme.colors.goldBadge + '30', theme.colors.surfaceHighlight]
                    })
                  }
                ]}
              >
                <Animated.View style={{
                  transform: [{ scale: coinsFlashAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1]
                  })}]
                }}>
                  <Ionicons name="cash" size={18} color={theme.colors.goldBadge} />
                </Animated.View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{coins}</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.statItem, 
                  { 
                    backgroundColor: xpFlashAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [theme.colors.surfaceHighlight, theme.colors.primary + '30', theme.colors.surfaceHighlight]
                    })
                  }
                ]}
              >
                <Animated.View style={{
                  transform: [{ scale: xpFlashAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1]
                  })}]
                }}>
                  <Ionicons name="star" size={18} color={theme.colors.primary} />
                </Animated.View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{xp}</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={[globalStyles.container, styles.content]}>
          {!userId ? (
            <View style={[styles.loginRequired, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="bulb" size={40} color={theme.colors.primary} style={styles.loginIcon} />
              <Text style={[globalStyles.title, styles.loginTitle]}>Login Required</Text>
              <Text style={[globalStyles.text, styles.loginText]}>
                Please log in to claim daily rewards and participate in daily challenges.
              </Text>
            </View>
          ) : (
            <>
              {/* Daily Bonus Card */}
              <View style={[globalStyles.card, styles.card]}>
                <LinearGradient
                  colors={theme.colors.secondaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="gift" size={20} color={theme.colors.text} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Daily Bonus</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <View style={styles.bonusInfo}>
                    <View style={[styles.bonusValue, { backgroundColor: theme.colors.surfaceHighlight, borderColor: `${theme.colors.goldBadge}50` }]}>
                      <Ionicons name="cash" size={24} color={theme.colors.goldBadge} />
                      <Text style={[styles.bonusValueText, { color: theme.colors.text }]}>250</Text>
                    </View>
                    <Text style={[globalStyles.textSecondary, styles.bonusText]}>Claim your free coins every 24 hours!</Text>
                  </View>
                  
                  {/* Show error if any */}
                  {bonusError && !bonusError.includes("Next bonus in") && (
                    <View style={[globalStyles.errorContainer, styles.errorContainer]}>
                      <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                      <Text style={globalStyles.errorText}>{bonusError}</Text>
                    </View>
                  )}
                  
                  {/* Claim Button or Countdown */}
                  <View style={styles.bonusAction}>
                    {showButton ? (
                      <TouchableOpacity 
                        style={[globalStyles.buttonSecondary, styles.claimButton]}
                        onPress={handleClaimDailyBonus}
                        disabled={claimInProgress}
                      >
                        {claimInProgress ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color={theme.colors.buttonText} />
                            <Text style={[globalStyles.buttonText, styles.buttonText]}>Claiming...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="cash" size={20} color={theme.colors.buttonText} />
                            <Text style={[globalStyles.buttonText, styles.buttonText]}>Claim Bonus</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.countdown, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                        <Ionicons name="hourglass" size={24} color={theme.colors.primary} />
                        <View style={styles.countdownInfo}>
                          <Text style={[globalStyles.textMuted, styles.countdownLabel]}>Next bonus in:</Text>
                          <Text style={[styles.countdownTime, { color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{formatCountdown(bonusCountdown)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Daily Question Card */}
              <View style={[globalStyles.card, styles.card]}>
                <LinearGradient
                  colors={theme.colors.primaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="bulb" size={20} color={theme.colors.text} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Daily Challenge</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  {loadingQuestion ? (
                    <View style={styles.loading}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={[globalStyles.textMuted, styles.loadingText]}>Loading challenge...</Text>
                    </View>
                  ) : questionError ? (
                    <View style={[globalStyles.errorContainer, styles.errorContainer]}>
                      <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                      <Text style={globalStyles.errorText}>{questionError}</Text>
                    </View>
                  ) : !questionData ? (
                    <View style={styles.emptyState}>
                      <Text style={[globalStyles.textMuted, styles.emptyText]}>No challenges available today. Check back tomorrow!</Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.question,
                      showCorrectAnimation && { borderColor: theme.colors.success, borderWidth: 1 },
                      showWrongAnimation && { borderColor: theme.colors.error, borderWidth: 1 }
                    ]}>
                      <View style={[styles.questionPrompt, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                        <FormattedQuestion questionText={questionData.prompt} />
                      </View>
                      
                      {questionData.alreadyAnswered ? (
                        <View style={styles.questionAnswered}>
                          {submitResult && (
                            <View style={[
                              styles.resultContainer,
                              submitResult.correct ? 
                                { backgroundColor: `${theme.colors.success}20`, borderColor: theme.colors.success } : 
                                { backgroundColor: `${theme.colors.error}20`, borderColor: theme.colors.error }
                            ]}>
                              <Ionicons 
                                name={submitResult.correct ? "checkmark-circle" : "close-circle"} 
                                size={24} 
                                color={submitResult.correct ? theme.colors.success : theme.colors.error} 
                              />
                              <Text style={[globalStyles.text, styles.resultText]}>
                                {submitResult.correct ? 
                                  `Correct! You earned ${submitResult.awardedCoins} coins.` : 
                                  `Not quite, but you still got ${submitResult.awardedCoins} coins.`}
                              </Text>
                            </View>
                          )}
                          
                          {/* Explanation Section */}
                          {(questionData.explanation || (submitResult && submitResult.explanation)) && (
                            <View style={[styles.explanation, { 
                              backgroundColor: theme.colors.surfaceHighlight, 
                              borderColor: theme.colors.border,
                              borderLeftColor: theme.colors.primary
                            }]}>
                              <Text style={[globalStyles.text, { fontWeight: '600' }, styles.explanationTitle]}>Explanation:</Text>
                              <Text style={[globalStyles.text, styles.explanationText]}>
                                {questionData.explanation || (submitResult && submitResult.explanation)}
                              </Text>
                            </View>
                          )}
                          
                          <View style={styles.nextQuestion}>
                            <View style={[styles.countdown, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                              <View style={styles.countdownInfo}>
                                <Text style={[globalStyles.textMuted, styles.countdownLabel]}>Next challenge in:</Text>
                                <Text style={[styles.countdownTime, { color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{formatCountdown(questionCountdown)}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.questionOptions}>
                          {questionData.options.map((option, index) => (
                            <TouchableOpacity 
                              key={index}
                              style={[
                                styles.optionItem,
                                { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border },
                                selectedAnswer === index && { 
                                  backgroundColor: `${theme.colors.primary}30`, 
                                  borderColor: theme.colors.primary 
                                }
                              ]}
                              onPress={() => setSelectedAnswer(index)}
                            >
                              <Text style={[
                                globalStyles.text,
                                styles.optionText,
                                selectedAnswer === index && { fontWeight: '600' }
                              ]}>
                                {option}
                              </Text>
                              {selectedAnswer === index && (
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} style={styles.optionIcon} />
                              )}
                            </TouchableOpacity>
                          ))}
                          
                          <TouchableOpacity 
                            style={[
                              globalStyles.buttonPrimary,
                              styles.submitButton,
                              selectedAnswer === null && { 
                                backgroundColor: `${theme.colors.primary}80`,
                              }
                            ]}
                            onPress={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                          >
                            <Text style={globalStyles.buttonText}>Submit Answer</Text>
                          </TouchableOpacity>
                          
                          <View style={styles.nextQuestion}>
                            <View style={[styles.countdown, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                              <View style={styles.countdownInfo}>
                                <Text style={[globalStyles.textMuted, styles.countdownLabel]}>Challenge refreshes in:</Text>
                                <Text style={[styles.countdownTime, { color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{formatCountdown(questionCountdown)}</Text>
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
      
      {/* BONUS CLAIM ANIMATION OVERLAY */}
      {showBonusAnimation && (
        <Animated.View style={[styles.overlay, {opacity: fadeAnim, backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.bonusAnimation, { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.primary,
            shadowColor: theme.colors.primary
          }]}>
            <Ionicons name="cash" size={60} color={theme.colors.goldBadge} style={styles.bonusIcon} />
            <View style={styles.bonusAnimationText}>
              <Text style={[globalStyles.title, styles.bonusAnimationTitle]}>Daily Bonus Claimed!</Text>
              <Text style={[globalStyles.textSecondary, styles.bonusAnimationSubtitle]}>+250 coins added to your account</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  userStats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  statValue: {
    marginLeft: 6,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  loginRequired: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  loginIcon: {
    marginBottom: 15,
  },
  loginTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  loginText: {
    textAlign: 'center',
    lineHeight: 22,
  },
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  bonusAnimation: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    maxWidth: '80%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  bonusIcon: {
    marginBottom: 20,
  },
  bonusAnimationText: {
    alignItems: 'center',
  },
  bonusAnimationTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  bonusAnimationSubtitle: {
    fontSize: 16,
  },
});

export default DailyStationScreen;
