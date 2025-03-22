import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { claimDailyBonus, getDailyQuestion, submitDailyAnswer } from '../../api/dailyStationService';
import { fetchUserData } from '../../store/slices/userSlice';
import FormattedQuestion from '../../components/FormattedQuestion';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

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
  const { userId, username, coins, xp, lastDailyClaim } = useSelector((state) => state.user);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [cardAnims] = useState([...Array(5)].map(() => new Animated.Value(0)));

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

  useEffect(() => {
    // Start all animations at once without delays
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
      ...cardAnims.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      )
    ]).start();
  }, []);

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
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        
        // Haptic success feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Update the user data in Redux
        dispatch(fetchUserData(userId));
      } else {
        // Server says already claimed
        setBonusError(data.message);
        // Don't change UI state - keep showing countdown
      }
    } catch (err) {
      setBonusError('Error: ' + err.message);
      setClaimInProgress(false);
      
      // Haptic error feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
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
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setQuestionError(null);
    
    try {
      const ansData = await submitDailyAnswer(userId, questionData.dayIndex, selectedAnswer);
      
      setSubmitResult(ansData);
      
      // Update the Redux store with new XP and coins
      dispatch(fetchUserData(userId));
      
      setQuestionData((prev) => ({
        ...prev,
        alreadyAnswered: true
      }));

      if (ansData.correct) {
        // Haptic success feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        setShowCorrectAnimation(true);
        setTimeout(() => setShowCorrectAnimation(false), 2000);
      } else {
        // Haptic error feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        setShowWrongAnimation(true);
        setTimeout(() => setShowWrongAnimation(false), 2000);
      }
    } catch (err) {
      setQuestionError('Error: ' + err.message);
      
      // Haptic error feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <View style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      zIndex: 999
    }}>
      <StatusBar hidden={true} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Header with User Stats */}
        {/* Main Header with User Stats */}
        <View style={{ backgroundColor: theme.colors.background }}>
          <Text style={[styles.mainTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
            DAILY <Text style={{ color: theme.colors.primary }}>STATION</Text>
          </Text>
          <View style={styles.headerSubtitleBox}>
            <Text style={[styles.mainSubtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              CLAIM REWARDS & COMPLETE DAILY CHALLENGES
            </Text>
          </View>
          
          {userId && (
            <View style={styles.userStats}>
              <View style={[styles.statItem, { 
                backgroundColor: theme.colors.surfaceHighlight,
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}>
                <Ionicons name="cash" size={18} color={theme.colors.goldBadge} />
                <Text style={[styles.statValue, { 
                  color: theme.colors.text, 
                  fontFamily: 'Orbitron-Bold'
                }]}>
                  {coins}
                </Text>
              </View>
              <View style={[styles.statItem, { 
                backgroundColor: theme.colors.surfaceHighlight,
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}>
                <Ionicons name="star" size={18} color={theme.colors.primary} />
                <Text style={[styles.statValue, { 
                  color: theme.colors.text,
                  fontFamily: 'Orbitron-Bold'
                }]}>
                  {xp}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Main Content */}
        {!userId ? (
          <Animated.View 
            style={{
              opacity: cardAnims[0],
              transform: [{ 
                translateY: cardAnims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }}
          >
            <View style={[styles.loginRequired, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow
            }]}>
              <Ionicons name="bulb" size={40} color={theme.colors.primary} style={styles.loginIcon} />
              <Text style={[styles.loginTitle, { 
                color: theme.colors.text, 
                fontFamily: 'Orbitron-Bold' 
              }]}>
                LOGIN REQUIRED
              </Text>
              <Text style={[styles.loginText, { 
                color: theme.colors.textSecondary,
                fontFamily: 'ShareTechMono'
              }]}>
                PLEASE LOG IN TO CLAIM DAILY REWARDS AND PARTICIPATE IN DAILY CHALLENGES.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Daily Bonus Card */}
            <Animated.View 
              style={{
                opacity: cardAnims[0],
                transform: [{ 
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                  <LinearGradient
                    colors={['transparent', theme.colors.primary + '40', 'transparent']}
                    start={{x: 0, y: 0.5}}
                    end={{x: 1, y: 0.5}}
                    style={styles.sectionTitleGradient}
                  />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                    DAILY REWARD
                  </Text>
                </View>
                
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="gift" size={22} color={theme.colors.buttonText} />
                </View>
              </View>
              
              <View style={[styles.card, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={theme.colors.secondaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="gift" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    DAILY BONUS
                  </Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <View style={styles.bonusInfo}>
                    <View style={[styles.bonusValue, { 
                      backgroundColor: theme.colors.surfaceHighlight, 
                      borderColor: `${theme.colors.goldBadge}50`,
                      borderWidth: 1
                    }]}>
                      <Ionicons name="cash" size={24} color={theme.colors.goldBadge} />
                      <Text style={[styles.bonusValueText, { 
                        color: theme.colors.goldBadge,
                        fontFamily: 'Orbitron-Bold'
                      }]}>
                        250
                      </Text>
                    </View>
                    <Text style={[styles.bonusText, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      CLAIM YOUR FREE COINS EVERY 24 HOURS!
                    </Text>
                  </View>
                  
                  {/* Show error if any */}
                  {bonusError && !bonusError.includes("Next bonus in") && (
                    <View style={[styles.errorContainer, { 
                      backgroundColor: `${theme.colors.error}10`,
                      borderColor: theme.colors.error,
                      borderLeftWidth: 4
                    }]}>
                      <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                      <Text style={[styles.errorText, { 
                        color: theme.colors.error,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        {bonusError}
                      </Text>
                    </View>
                  )}
                  
                  {/* Claim Button or Countdown */}
                  <View style={styles.bonusAction}>
                    {showButton ? (
                      <TouchableOpacity 
                        style={[styles.claimButton, { 
                          backgroundColor: theme.colors.buttonPrimary,
                          shadowColor: theme.colors.shadow
                        }]}
                        onPress={handleClaimDailyBonus}
                        disabled={claimInProgress}
                      >
                        {claimInProgress ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color={theme.colors.buttonText} />
                            <Text style={[styles.buttonText, { 
                              color: theme.colors.buttonText,
                              fontFamily: 'Orbitron-Bold'
                            }]}>
                              CLAIMING...
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="cash" size={20} color={theme.colors.buttonText} />
                            <Text style={[styles.buttonText, { 
                              color: theme.colors.buttonText,
                              fontFamily: 'Orbitron-Bold'
                            }]}>
                              CLAIM BONUS
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.countdown, { 
                        backgroundColor: theme.colors.surfaceHighlight,
                        borderColor: theme.colors.border
                      }]}>
                        <Ionicons name="hourglass" size={24} color={theme.colors.primary} />
                        <View style={styles.countdownInfo}>
                          <Text style={[styles.countdownLabel, { 
                            color: theme.colors.textMuted,
                            fontFamily: 'ShareTechMono'
                          }]}>
                            NEXT BONUS IN:
                          </Text>
                          <Text style={[styles.countdownTime, { 
                            color: theme.colors.text,
                            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                            fontWeight: 'bold'
                          }]}>
                            {formatCountdown(bonusCountdown)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Daily Question Card */}
            <Animated.View 
              style={{
                opacity: cardAnims[1],
                transform: [{ 
                  translateY: cardAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.toolCard + '20' }]}>
                  <LinearGradient
                    colors={['transparent', theme.colors.toolCard + '40', 'transparent']}
                    start={{x: 0, y: 0.5}}
                    end={{x: 1, y: 0.5}}
                    style={styles.sectionTitleGradient}
                  />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                    DAILY CHALLENGE
                  </Text>
                </View>
                
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.toolCard }]}>
                  <Ionicons name="bulb" size={22} color={theme.colors.buttonText} />
                </View>
              </View>
              
              <View style={[styles.card, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow
              }]}>
                <LinearGradient
                  colors={[theme.colors.toolCard, theme.colors.toolCard + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="bulb" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.cardTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    DAILY CHALLENGE
                  </Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  {loadingQuestion ? (
                    <View style={styles.loading}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={[styles.loadingText, { 
                        color: theme.colors.textMuted,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        LOADING CHALLENGE...
                      </Text>
                    </View>
                  ) : questionError ? (
                    <View style={[styles.errorContainer, { 
                      backgroundColor: `${theme.colors.error}10`,
                      borderColor: theme.colors.error,
                      borderLeftWidth: 4
                    }]}>
                      <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                      <Text style={[styles.errorText, { 
                        color: theme.colors.error,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        {questionError}
                      </Text>
                    </View>
                  ) : !questionData ? (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, { 
                        color: theme.colors.textMuted,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        NO CHALLENGES AVAILABLE TODAY. CHECK BACK TOMORROW!
                      </Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.question,
                      showCorrectAnimation && { borderColor: theme.colors.success, borderWidth: 1 },
                      showWrongAnimation && { borderColor: theme.colors.error, borderWidth: 1 }
                    ]}>
                      <View style={[styles.questionPrompt, { 
                        backgroundColor: theme.colors.surfaceHighlight, 
                        borderColor: theme.colors.border 
                      }]}>
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
                              <Text style={[styles.resultText, { 
                                color: theme.colors.text,
                                fontFamily: 'ShareTechMono'
                              }]}>
                                {submitResult.correct ? 
                                  `CORRECT! YOU EARNED ${submitResult.awardedCoins} COINS.` : 
                                  `NOT QUITE, BUT YOU STILL GOT ${submitResult.awardedCoins} COINS.`}
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
                              <Text style={[styles.explanationTitle, { 
                                color: theme.colors.text,
                                fontFamily: 'Orbitron-Bold',
                                fontWeight: '600'
                              }]}>
                                EXPLANATION:
                              </Text>
                              <FormattedQuestion questionText={questionData.explanation || (submitResult && submitResult.explanation)} />
                            </View>
                          )}
                          
                          <View style={styles.nextQuestion}>
                            <View style={[styles.countdown, { 
                              backgroundColor: theme.colors.surfaceHighlight, 
                              borderColor: theme.colors.border 
                            }]}>
                              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                              <View style={styles.countdownInfo}>
                                <Text style={[styles.countdownLabel, { 
                                  color: theme.colors.textMuted,
                                  fontFamily: 'ShareTechMono'
                                }]}>
                                  NEXT CHALLENGE IN:
                                </Text>
                                <Text style={[styles.countdownTime, { 
                                  color: theme.colors.text,
                                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                  fontWeight: 'bold'
                                }]}>
                                  {formatCountdown(questionCountdown)}
                                </Text>
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
                                { 
                                  backgroundColor: theme.colors.surfaceHighlight, 
                                  borderColor: theme.colors.border 
                                },
                                selectedAnswer === index && { 
                                  backgroundColor: `${theme.colors.primary}30`, 
                                  borderColor: theme.colors.primary 
                                }
                              ]}
                              onPress={() => {
                                if (Platform.OS === 'ios') {
                                  Haptics.selectionAsync();
                                }
                                setSelectedAnswer(index);
                              }}
                            >
                              <View style={[styles.optionLetter, { 
                                backgroundColor: 
                                  selectedAnswer === index ? 
                                    theme.colors.primary : 
                                    'rgba(255, 255, 255, 0.1)'
                              }]}>
                                <Text style={[styles.optionLetterText, { 
                                  color: selectedAnswer === index ? 
                                    theme.colors.buttonText : theme.colors.text,
                                  fontFamily: 'Orbitron-Bold'
                                }]}>
                                  {String.fromCharCode(65 + index)}
                                </Text>
                              </View>
                              <Text style={[
                                styles.optionText,
                                { color: theme.colors.text, fontFamily: 'ShareTechMono' },
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
                              styles.submitButton,
                              { backgroundColor: theme.colors.buttonPrimary },
                              selectedAnswer === null && { 
                                backgroundColor: `${theme.colors.primary}80`,
                              }
                            ]}
                            onPress={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                          >
                            <Text style={[styles.submitButtonText, { 
                              color: theme.colors.buttonText,
                              fontFamily: 'Orbitron-Bold'
                            }]}>
                              SUBMIT ANSWER
                            </Text>
                          </TouchableOpacity>
                          
                          <View style={styles.nextQuestion}>
                            <View style={[styles.countdown, { 
                              backgroundColor: theme.colors.surfaceHighlight, 
                              borderColor: theme.colors.border 
                            }]}>
                              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                              <View style={styles.countdownInfo}>
                                <Text style={[styles.countdownLabel, { 
                                  color: theme.colors.textMuted,
                                  fontFamily: 'ShareTechMono'
                                }]}>
                                  CHALLENGE REFRESHES IN:
                                </Text>
                                <Text style={[styles.countdownTime, { 
                                  color: theme.colors.text,
                                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                  fontWeight: 'bold'
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
            </Animated.View>
          </>
        )}
        
        {/* Bottom space */}
        <View style={{ height: 50 }} />
      </ScrollView>
      
      {/* BONUS CLAIM ANIMATION OVERLAY */}
      {showBonusAnimation && (
        <Animated.View style={[styles.overlay, {
          opacity: fadeAnim, 
          backgroundColor: theme.colors.overlay
        }]}>
          <View style={[styles.bonusAnimation, { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.primary,
            shadowColor: theme.colors.primary
          }]}>
            <Ionicons name="cash" size={60} color={theme.colors.goldBadge} style={styles.bonusIcon} />
            <View style={styles.bonusAnimationText}>
              <Text style={[styles.bonusAnimationTitle, { 
                color: theme.colors.text,
                fontFamily: 'Orbitron-Bold'
              }]}>
                DAILY BONUS CLAIMED!
              </Text>
              <Text style={[styles.bonusAnimationSubtitle, { 
                color: theme.colors.textSecondary,
                fontFamily: 'ShareTechMono'
              }]}>
                +250 COINS ADDED TO YOUR ACCOUNT
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base layout
  scrollView: {
    flex: 1,
  },
  
  // Main Header
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 0,
    marginBottom: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerSubtitleBox: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mainSubtitle: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statValue: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionTitleBg: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionTitleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Login Required
  loginRequired: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 15,
    marginTop: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loginIcon: {
    marginBottom: 15,
  },
  loginTitle: {
    fontSize: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  loginText: {
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  
  // Cards
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  
  // Daily Bonus Section
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
  },
  bonusValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bonusText: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.5,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
    letterSpacing: 0.5,
  },
  countdownTime: {
    fontSize: 16,
    letterSpacing: 1,
  },
  
  // Question section
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    letterSpacing: 0.5,
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
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
    letterSpacing: 0.5,
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
    letterSpacing: 0.5,
  },
  
  // Animation overlay
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
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bonusAnimationSubtitle: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default DailyStationScreen;
