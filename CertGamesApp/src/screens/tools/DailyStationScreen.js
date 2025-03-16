import React, { useState, useEffect } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { claimDailyBonus, getDailyQuestion, submitDailyAnswer } from '../../api/dailyStationService';
import { fetchUserData } from '../../store/slices/userSlice';
import FormattedQuestion from '../../components/FormattedQuestion';

// Helper to format seconds as HH:MM:SS
function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}

const DailyStationScreen = () => {
  const dispatch = useDispatch();
  const { userId, username, coins, xp, lastDailyClaim } = useSelector((state) => state.user);

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
  const fadeAnim = useState(new Animated.Value(0))[0];

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
      
      // Update the Redux store with new XP and coins
      dispatch(fetchUserData(userId));
      
      setQuestionData((prev) => ({
        ...prev,
        alreadyAnswered: true
      }));

      if (ansData.correct) {
        setShowCorrectAnimation(true);
        setTimeout(() => setShowCorrectAnimation(false), 2000);
      } else {
        setShowWrongAnimation(true);
        setTimeout(() => setShowWrongAnimation(false), 2000);
      }
    } catch (err) {
      setQuestionError('Error: ' + err.message);
    }
  };

  // Not needed anymore since we're using the FormattedQuestion component

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Station</Text>
          <Text style={styles.subtitle}>Claim your daily rewards and answer the challenge</Text>
          
          {userId && (
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Ionicons name="cash" size={18} color="#FFD700" />
                <Text style={styles.statValue}>{coins}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={18} color="#0095FF" />
                <Text style={styles.statValue}>{xp}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {!userId ? (
            <View style={styles.loginRequired}>
              <Ionicons name="bulb" size={40} color="#6543CC" style={styles.loginIcon} />
              <Text style={styles.loginTitle}>Login Required</Text>
              <Text style={styles.loginText}>
                Please log in to claim daily rewards and participate in daily challenges.
              </Text>
            </View>
          ) : (
            <>
              {/* Daily Bonus Card */}
              <View style={styles.card}>
                <LinearGradient
                  colors={['#FF4C8B', '#FF7950']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="gift" size={20} color="#FFFFFF" />
                  <Text style={styles.cardTitle}>Daily Bonus</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <View style={styles.bonusInfo}>
                    <View style={styles.bonusValue}>
                      <Ionicons name="cash" size={24} color="#FFD700" />
                      <Text style={styles.bonusValueText}>250</Text>
                    </View>
                    <Text style={styles.bonusText}>Claim your free coins every 24 hours!</Text>
                  </View>
                  
                  {/* Show error if any */}
                  {bonusError && !bonusError.includes("Next bonus in") && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color="#FF4E4E" />
                      <Text style={styles.errorText}>{bonusError}</Text>
                    </View>
                  )}
                  
                  {/* Claim Button or Countdown */}
                  <View style={styles.bonusAction}>
                    {showButton ? (
                      <TouchableOpacity 
                        style={styles.claimButton}
                        onPress={handleClaimDailyBonus}
                        disabled={claimInProgress}
                      >
                        {claimInProgress ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.buttonText}>Claiming...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Ionicons name="cash" size={20} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Claim Bonus</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.countdown}>
                        <Ionicons name="hourglass" size={24} color="#6543CC" />
                        <View style={styles.countdownInfo}>
                          <Text style={styles.countdownLabel}>Next bonus in:</Text>
                          <Text style={styles.countdownTime}>{formatCountdown(bonusCountdown)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Daily Question Card */}
              <View style={styles.card}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardHeader}
                >
                  <Ionicons name="bulb" size={20} color="#FFFFFF" />
                  <Text style={styles.cardTitle}>Daily Challenge</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  {loadingQuestion ? (
                    <View style={styles.loading}>
                      <ActivityIndicator size="large" color="#6543CC" />
                      <Text style={styles.loadingText}>Loading challenge...</Text>
                    </View>
                  ) : questionError ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color="#FF4E4E" />
                      <Text style={styles.errorText}>{questionError}</Text>
                    </View>
                  ) : !questionData ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No challenges available today. Check back tomorrow!</Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.question,
                      showCorrectAnimation && styles.correctAnimation,
                      showWrongAnimation && styles.wrongAnimation
                    ]}>
                      <View style={styles.questionPrompt}>
                        <FormattedQuestion questionText={questionData.prompt} />
                      </View>
                      
                      {questionData.alreadyAnswered ? (
                        <View style={styles.questionAnswered}>
                          {submitResult && (
                            <View style={[
                              styles.resultContainer,
                              submitResult.correct ? styles.correctResult : styles.incorrectResult
                            ]}>
                              <Ionicons 
                                name={submitResult.correct ? "checkmark-circle" : "close-circle"} 
                                size={24} 
                                color={submitResult.correct ? "#2EBB77" : "#FF4E4E"} 
                              />
                              <Text style={styles.resultText}>
                                {submitResult.correct ? 
                                  `Correct! You earned ${submitResult.awardedCoins} coins.` : 
                                  `Not quite, but you still got ${submitResult.awardedCoins} coins.`}
                              </Text>
                            </View>
                          )}
                          
                          {/* Explanation Section */}
                          {(questionData.explanation || (submitResult && submitResult.explanation)) && (
                            <View style={styles.explanation}>
                              <Text style={styles.explanationTitle}>Explanation:</Text>
                              <FormattedQuestion questionText={questionData.explanation || (submitResult && submitResult.explanation)} />
                            </View>
                          )}
                          
                          <View style={styles.nextQuestion}>
                            <View style={styles.countdown}>
                              <Ionicons name="calendar" size={24} color="#6543CC" />
                              <View style={styles.countdownInfo}>
                                <Text style={styles.countdownLabel}>Next challenge in:</Text>
                                <Text style={styles.countdownTime}>{formatCountdown(questionCountdown)}</Text>
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
                                selectedAnswer === index && styles.selectedOption
                              ]}
                              onPress={() => setSelectedAnswer(index)}
                            >
                              <Text style={[
                                styles.optionText,
                                selectedAnswer === index && styles.selectedOptionText
                              ]}>
                                {option}
                              </Text>
                              {selectedAnswer === index && (
                                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={styles.optionIcon} />
                              )}
                            </TouchableOpacity>
                          ))}
                          
                          <TouchableOpacity 
                            style={[
                              styles.submitButton,
                              selectedAnswer === null && styles.disabledButton
                            ]}
                            onPress={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                          >
                            <Text style={styles.buttonText}>Submit Answer</Text>
                          </TouchableOpacity>
                          
                          <View style={styles.nextQuestion}>
                            <View style={styles.countdown}>
                              <Ionicons name="calendar" size={24} color="#6543CC" />
                              <View style={styles.countdownInfo}>
                                <Text style={styles.countdownLabel}>Challenge refreshes in:</Text>
                                <Text style={styles.countdownTime}>{formatCountdown(questionCountdown)}</Text>
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
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
          <View style={styles.bonusAnimation}>
            <Ionicons name="cash" size={60} color="#FFD700" style={styles.bonusIcon} />
            <View style={styles.bonusAnimationText}>
              <Text style={styles.bonusAnimationTitle}>Daily Bonus Claimed!</Text>
              <Text style={styles.bonusAnimationSubtitle}>+250 coins added to your account</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#171A23',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2C3D',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9DA8B9',
    marginBottom: 15,
  },
  userStats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  statValue: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  loginRequired: {
    backgroundColor: '#171A23',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2C3D',
  },
  loginIcon: {
    marginBottom: 15,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  loginText: {
    color: '#9DA8B9',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#171A23',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2C3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  bonusValueText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bonusText: {
    color: '#9DA8B9',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF4E4E',
    marginLeft: 10,
    flex: 1,
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
    backgroundColor: '#FF4C8B',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#2A2C3D',
  },
  countdownInfo: {
    marginLeft: 10,
  },
  countdownLabel: {
    color: '#9DA8B9',
    fontSize: 12,
  },
  countdownTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#9DA8B9',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9DA8B9',
    textAlign: 'center',
  },
  question: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  questionPrompt: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2A2C3D',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  questionOptions: {
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2C3D',
  },
  selectedOption: {
    backgroundColor: 'rgba(101, 67, 204, 0.2)',
    borderColor: '#6543CC',
  },
  optionText: {
    color: '#FFFFFF',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  optionIcon: {
    marginLeft: 10,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6543CC',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
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
  },
  correctResult: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 187, 119, 0.3)',
  },
  incorrectResult: {
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 78, 0.3)',
  },
  resultText: {
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  explanation: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2C3D',
    borderLeftWidth: 3,
    borderLeftColor: '#6543CC',
  },
  explanationTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 10,
  },
  explanationText: {
    color: '#9DA8B9',
    lineHeight: 22,
  },
  correctAnimation: {
    borderColor: '#2EBB77',
    borderWidth: 1,
  },
  wrongAnimation: {
    borderColor: '#FF4E4E',
    borderWidth: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  bonusAnimation: {
    backgroundColor: '#171A23',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#6543CC',
    shadowColor: '#6543CC',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bonusAnimationSubtitle: {
    color: '#9DA8B9',
    fontSize: 16,
  },
});

export default DailyStationScreen;
