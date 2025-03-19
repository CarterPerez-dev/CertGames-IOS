// src/screens/tools/ScenarioSphereScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useToast } from 'react-native-toast-notifications';
import { streamScenario, streamScenarioQuestions } from '../../api/scenarioService';

// Sample attack types - in a real app, you'd import this from a separate file
const ATTACK_TYPES = [
  "AI Activation Exploit",
  "AI Algorithm Manipulation",
  "AI Data Leakage",
  "AI Data Poisoning",
  "Backdoor",
  "Brute Force",
  "Buffer Overflow",
  "Business Email Compromise",
  "Cloud Service Abuse",
  "Command Injection",
  "Cross-Site Request Forgery",
  "Cross-Site Scripting",
  "Cryptojacking",
  "DDoS Attack",
  "DNS Hijacking",
  "DNS Spoofing",
  "Data Exfiltration",
  "Deepfake",
  "Drive-by Download",
  "Eavesdropping",
  "Evil Twin Attack",
  "File Inclusion",
  "Firmware Attack",
  "GDPR Violation",
  "Honey Trap",
  "IMSI Catcher",
  "Identity Theft",
  "Insider Threat",
  "IoT Botnet",
  "Keylogger",
  "LDAP Injection",
  "LLM Prompt Injection",
  "Logic Bomb",
  "MFA Bypass",
  "MitM Attack",
  "OAuth Token Theft",
  "Password Spraying",
  "Phishing",
  "Ping of Death",
  "Privilege Escalation",
  "Ransomware",
  "Remote Code Execution",
  "Reverse Shell",
  "Rootkit",
  "SAML Attack",
  "SQL Injection",
  "Sandbox Escape",
  "Session Hijacking",
  "Side-Channel Attack",
  "Social Engineering",
  "Software Supply Chain",
  "Spear Phishing",
  "Spyware",
  "Typosquatting",
  "USB Drop Attack",
  "Vishing",
  "Virtual Host Confusion",
  "Watering Hole",
  "Web Shell",
  "Zero-Day Exploit"
];

const ScenarioSphereScreen = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [industry, setIndustry] = useState("Finance");
  const [attackType, setAttackType] = useState("");
  const [skillLevel, setSkillLevel] = useState("Script Kiddie");
  const [threatIntensity, setThreatIntensity] = useState(50);

  const [scenarioText, setScenarioText] = useState("");
  const [interactiveQuestions, setInteractiveQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scoreCounter, setScoreCounter] = useState(0);

  const [outputExpanded, setOutputExpanded] = useState(true);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [scenarioGenerated, setScenarioGenerated] = useState(false);

  const toast = useToast();
  const scrollViewRef = useRef();
  const scenarioOutputRef = useRef();

  // Auto-scroll scenario output
  useEffect(() => {
    if (scenarioText && scenarioOutputRef.current && isGenerating) {
      scenarioOutputRef.current.scrollToEnd({ animated: true });
    }
  }, [scenarioText, isGenerating]);

  const handleAttackTypeChange = (text) => {
    setAttackType(text);
    setShowAllSuggestions(false);
    setErrorMessage("");

    if (text.length > 0) {
      const filteredSuggestions = ATTACK_TYPES.filter(
        (attack) => attack.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setAttackType(suggestion);
    setShowSuggestions(false);
  };

  const handleOutsideSuggestionPress = () => {
    setShowSuggestions(false);
    setShowAllSuggestions(false);
    Keyboard.dismiss();
  };

  const handleGenerateScenario = async () => {
    if (!attackType.trim()) {
      setErrorMessage("Please enter the Type of Attack");
      toast.show("Please enter the Type of Attack", {
        type: 'danger',
        duration: 3000,
      });
      return;
    }

    setErrorMessage("");
    setIsGenerating(true);
    setScenarioText("");
    setInteractiveQuestions([]);
    setUserAnswers({});
    setFeedback({});
    setScoreCounter(0);
    setScenarioGenerated(true);
    setGenerationComplete(false);

    try {
      // Get the scenario
      const scenarioData = await streamScenario(
        industry,
        attackType,
        skillLevel,
        threatIntensity
      );
      
      setScenarioText(scenarioData);
      setGenerationComplete(true);
      
      // Now fetch the questions based on the scenario
      fetchQuestions(scenarioData);
    } catch (error) {
      console.error('Error generating scenario:', error);
      setErrorMessage("An error occurred while generating the scenario");
      toast.show("Error generating scenario. Please try again.", {
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchQuestions = async (finalScenarioText) => {
    if (!finalScenarioText) return;

    try {
      const questionsData = await streamScenarioQuestions(finalScenarioText);
      
      if (Array.isArray(questionsData)) {
        const errorObj = questionsData.find(q => q.error);
        if (errorObj) {
          console.error("Error in questions generation:", errorObj.error);
          setErrorMessage(`Error generating questions: ${errorObj.error}`);
          toast.show(`Error generating questions: ${errorObj.error}`, {
            type: 'danger',
            duration: 3000,
          });
        } else if (questionsData.length === 3) {
          setInteractiveQuestions(questionsData);
        } else {
          console.error("Expected exactly 3 questions, but received:", questionsData);
          setErrorMessage("Unexpected number of questions received");
        }
      } else {
        console.error("Parsed questions are not in an array format.");
        setErrorMessage("Invalid format for interactive questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setErrorMessage("Error fetching questions");
      toast.show("Error fetching questions. Please try again.", {
        type: 'danger',
        duration: 3000,
      });
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    // Already answered? do nothing
    if (Object.prototype.hasOwnProperty.call(userAnswers, questionIndex)) {
      return;
    }
    
    const question = interactiveQuestions[questionIndex];
    const isCorrect = selectedOption === question.correct_answer;

    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: selectedOption,
    }));

    setFeedback((prevFeedback) => ({
      ...prevFeedback,
      [questionIndex]: {
        isCorrect,
        explanation: question.explanation,
      },
    }));
    
    if (isCorrect) {
      setScoreCounter(prev => prev + 1);
      toast.show("Correct answer!", {
        type: 'success',
        duration: 2000,
      });
    } else {
      toast.show("Incorrect answer.", {
        type: 'danger',
        duration: 2000,
      });
    }
  };

  // Calculate a rough progress percentage based on paragraph count
  const calculateStreamProgress = () => {
    if (!scenarioText) return 0;
    const paragraphs = scenarioText.split('\n\n').filter(p => p.trim().length > 0);
    return Math.min(Math.ceil((paragraphs.length / 5) * 100), 90);
  };

  const streamProgress = calculateStreamProgress();

  return (
    <TouchableWithoutFeedback onPress={handleOutsideSuggestionPress}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <Text style={styles.title}>
            <Ionicons name="shield" size={24} color="#6543cc" /> Scenario Sphere
          </Text>
          <Text style={styles.subtitle}>
            Immerse yourself in realistic cybersecurity scenarios and test your knowledge
          </Text>
          
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={20} color="#ff4e4e" />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity 
                style={styles.errorCloseButton}
                onPress={() => setErrorMessage("")}
              >
                <Ionicons name="close" size={18} color="#9da8b9" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        
        <ScrollView style={styles.scrollView} ref={scrollViewRef}>
          <View style={styles.content}>
            <View style={styles.paramsCard}>
              <View style={styles.paramsHeader}>
                <View style={styles.paramsHeaderLeft}>
                  <Ionicons name="settings" size={20} color="#6543cc" />
                  <Text style={styles.paramsTitle}>Generation Parameters</Text>
                </View>
                
                <View style={styles.scoreCounter}>
                  <Text style={styles.scoreValue}>
                    <Text style={styles.scoreHighlight}>{scoreCounter}</Text>/3
                  </Text>
                  <Text style={styles.scoreLabel}>Correct</Text>
                </View>
              </View>
              
              <View style={styles.paramsContent}>
                {/* Industry Picker */}
                <View style={styles.paramGroup}>
                  <Text style={styles.paramLabel}>
                    <Ionicons name="business" size={16} color="#6543cc" /> Industry
                  </Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={industry}
                      onValueChange={(value) => setIndustry(value)}
                      style={styles.picker}
                      dropdownIconColor="#6543cc"
                      itemStyle={styles.pickerItem}
                      enabled={!isGenerating}
                    >
                      <Picker.Item label="Finance" value="Finance" />
                      <Picker.Item label="Healthcare" value="Healthcare" />
                      <Picker.Item label="Retail" value="Retail" />
                      <Picker.Item label="Technology" value="Technology" />
                      <Picker.Item label="Energy" value="Energy" />
                      <Picker.Item label="Education" value="Education" />
                      <Picker.Item label="Supply Chain" value="Supply Chain" />
                      <Picker.Item label="Telecommunications" value="Telecommunications" />
                      <Picker.Item label="Pharmaceutical" value="Pharmaceutical" />
                      <Picker.Item label="Transportation" value="Transportation" />
                      <Picker.Item label="Cybersecurity Company" value="Cybersecurity Company" />
                      <Picker.Item label="Manufacturing" value="Manufacturing" />
                      <Picker.Item label="CYBERPUNK2077" value="CYBERPUNK2077" />
                    </Picker>
                  </View>
                </View>
                
                {/* Attack Type Input */}
                <View style={styles.paramGroup}>
                  <Text style={styles.paramLabel}>
                    <Ionicons name="skull" size={16} color="#6543cc" /> Attack Type
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="search" size={20} color="#6543cc" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Search or enter attack type..."
                      placeholderTextColor="#9da8b9"
                      value={attackType}
                      onChangeText={handleAttackTypeChange}
                      editable={!isGenerating}
                    />
                  </View>
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <FlatList
                        data={showAllSuggestions ? suggestions : suggestions.slice(0, 5)}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => selectSuggestion(item)}
                          >
                            <Text style={styles.suggestionText}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        style={styles.suggestionsList}
                        nestedScrollEnabled={true}
                      />
                      
                      {!showAllSuggestions && suggestions.length > 5 && (
                        <TouchableOpacity 
                          style={styles.showAllButton}
                          onPress={() => setShowAllSuggestions(true)}
                        >
                          <Ionicons name="chevron-down" size={16} color="#6543cc" />
                          <Text style={styles.showAllText}>
                            Show all options ({suggestions.length})
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                
                {/* Skill Level Picker */}
                <View style={styles.paramGroup}>
                  <Text style={styles.paramLabel}>
                    <Ionicons name="person" size={16} color="#6543cc" /> Attacker Skill Level
                  </Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={skillLevel}
                      onValueChange={(value) => setSkillLevel(value)}
                      style={styles.picker}
                      dropdownIconColor="#6543cc"
                      itemStyle={styles.pickerItem}
                      enabled={!isGenerating}
                    >
                      <Picker.Item label="Script Kiddie" value="Script Kiddie" />
                      <Picker.Item label="Intermediate" value="Intermediate" />
                      <Picker.Item label="Advanced" value="Advanced" />
                      <Picker.Item label="APT" value="APT" />
                    </Picker>
                  </View>
                </View>
                
                {/* Threat Intensity Slider */}
                <View style={styles.paramGroup}>
                  <View style={styles.sliderLabelContainer}>
                    <Text style={styles.paramLabel}>
                      <Ionicons name="thermometer" size={16} color="#6543cc" /> Threat Intensity
                    </Text>
                    <View style={styles.intensityBadge}>
                      <Text style={styles.intensityValue}>{threatIntensity}</Text>
                    </View>
                  </View>
                  
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    value={threatIntensity}
                    onValueChange={(value) => setThreatIntensity(value)}
                    minimumTrackTintColor="#6543cc"
                    maximumTrackTintColor="#333333"
                    thumbTintColor="#6543cc"
                    disabled={isGenerating}
                  />
                  
                  <View style={styles.sliderMarkers}>
                    <Text style={styles.sliderMarker}>Low</Text>
                    <Text style={styles.sliderMarker}>Medium</Text>
                    <Text style={styles.sliderMarker}>High</Text>
                  </View>
                </View>
                
                {/* Generate Button */}
                <TouchableOpacity
                  style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                  onPress={handleGenerateScenario}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.buttonText}>Generating...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Generate Scenario</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {scenarioGenerated && (
              <View style={styles.results}>
                {/* Scenario Output Card */}
                <View style={styles.outputCard}>
                  <TouchableOpacity 
                    style={styles.outputHeader}
                    onPress={() => setOutputExpanded(!outputExpanded)}
                  >
                    <View style={styles.outputHeaderLeft}>
                      <Ionicons name="lock-closed" size={20} color="#6543cc" />
                      <Text style={styles.outputTitle}>Generated Scenario</Text>
                    </View>
                    
                    <View style={styles.outputControls}>
                      {!generationComplete && isGenerating && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[styles.progressFill, { width: `${streamProgress}%` }]}
                            />
                          </View>
                          <Text style={styles.progressLabel}>Generating...</Text>
                        </View>
                      )}
                      
                      <TouchableOpacity style={styles.toggleButton}>
                        <Ionicons 
                          name={outputExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#9da8b9" 
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  
                  {outputExpanded && (
                    <ScrollView 
                      style={styles.outputContent}
                      ref={scenarioOutputRef}
                    >
                      {scenarioText ? (
                        <Text style={styles.scenarioText}>
                          {scenarioText}
                          {isGenerating && <Text style={styles.cursor}>|</Text>}
                        </Text>
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <ActivityIndicator 
                            color="#6543cc" 
                            size="large"
                            animating={isGenerating}
                          />
                          <Text style={styles.placeholderText}>
                            Scenario will appear here...
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  )}
                </View>
                
                {/* Questions Card */}
                {interactiveQuestions && interactiveQuestions.length > 0 && (
                  <View style={styles.questionsCard}>
                    <TouchableOpacity 
                      style={styles.questionsHeader}
                      onPress={() => setQuestionsExpanded(!questionsExpanded)}
                    >
                      <View style={styles.questionsHeaderLeft}>
                        <Ionicons name="help-circle" size={20} color="#6543cc" />
                        <Text style={styles.questionsTitle}>Knowledge Assessment</Text>
                      </View>
                      
                      <TouchableOpacity style={styles.toggleButton}>
                        <Ionicons 
                          name={questionsExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#9da8b9" 
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    
                    {questionsExpanded && (
                      <View style={styles.questionsContent}>
                        {Object.keys(feedback).length === interactiveQuestions.length && (
                          <View style={styles.assessmentComplete}>
                            <Ionicons name="checkmark-circle" size={24} color="#2ebb77" />
                            <View style={styles.assessmentResults}>
                              <Text style={styles.completionMessage}>Assessment Complete</Text>
                              <Text style={styles.scoreMessage}>
                                You scored {scoreCounter} out of {interactiveQuestions.length} correct
                              </Text>
                            </View>
                          </View>
                        )}
                        
                        {interactiveQuestions.map((question, index) => {
                          const questionFeedback = feedback[index];
                          const isCorrect = questionFeedback?.isCorrect;
                          
                          return (
                            <View key={index} style={styles.questionCard}>
                              <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                {questionFeedback && (
                                  <View style={[
                                    styles.questionStatus,
                                    isCorrect ? styles.correctStatus : styles.incorrectStatus
                                  ]}>
                                    <Ionicons 
                                      name={isCorrect ? "checkmark" : "close"} 
                                      size={16} 
                                      color={isCorrect ? "#2ebb77" : "#ff4e4e"} 
                                    />
                                    <Text style={[
                                      styles.statusText,
                                      isCorrect ? styles.correctText : styles.incorrectText
                                    ]}>
                                      {isCorrect ? "Correct" : "Incorrect"}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              
                              <Text style={styles.questionText}>{question.question}</Text>
                              
                              <View style={styles.optionsContainer}>
                                {question.options && Object.entries(question.options).map(([optionLetter, optionText]) => {
                                  const isSelected = userAnswers[index] === optionLetter;
                                  const showCorrect = questionFeedback && question.correct_answer === optionLetter;
                                  const showIncorrect = questionFeedback && isSelected && !isCorrect;
                                  
                                  return (
                                    <TouchableOpacity
                                      key={optionLetter}
                                      style={[
                                        styles.optionButton,
                                        isSelected && styles.selectedOption,
                                        showCorrect && styles.correctOption,
                                        showIncorrect && styles.incorrectOption
                                      ]}
                                      onPress={() => handleAnswerSelect(index, optionLetter)}
                                      disabled={Object.prototype.hasOwnProperty.call(userAnswers, index)}
                                    >
                                      <View style={[
                                        styles.optionLetter,
                                        showCorrect && styles.correctLetter,
                                        showIncorrect && styles.incorrectLetter
                                      ]}>
                                        <Text style={styles.optionLetterText}>{optionLetter}</Text>
                                      </View>
                                      
                                      <Text style={styles.optionText}>{optionText}</Text>
                                      
                                      {showCorrect && (
                                        <Ionicons name="checkmark" size={20} color="#2ebb77" style={styles.optionIcon} />
                                      )}
                                      {showIncorrect && (
                                        <Ionicons name="close" size={20} color="#ff4e4e" style={styles.optionIcon} />
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                              
                              {questionFeedback && (
                                <View style={styles.feedbackContainer}>
                                  <Ionicons name="bulb" size={20} color="#ffc107" style={styles.feedbackIcon} />
                                  <Text style={styles.feedbackExplanation}>
                                    {questionFeedback.explanation}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c15',
  },
  header: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    margin: 15,
    marginBottom: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 4,
    borderTopColor: '#6543cc',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e2e2e2',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9da8b9',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 78, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  errorText: {
    color: '#ff4e4e',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
    paddingTop: 0,
  },
  paramsCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  paramsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paramsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  scoreCounter: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  scoreHighlight: {
    color: '#6543cc',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9da8b9',
  },
  paramsContent: {
    padding: 15,
  },
  paramGroup: {
    marginBottom: 15,
  },
  paramLabel: {
    fontSize: 14,
    color: '#9da8b9',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  picker: {
    color: '#e2e2e2',
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
    color: '#e2e2e2',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#e2e2e2',
    height: 50,
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: '#171a23',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
    zIndex: 1,
  },
  suggestionsList: {
    padding: 5,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 10,
    borderRadius: 5,
  },
  suggestionText: {
    color: '#e2e2e2',
    fontSize: 14,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2c3d',
    gap: 5,
  },
  showAllText: {
    color: '#6543cc',
    fontSize: 14,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityBadge: {
    backgroundColor: '#6543cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  intensityValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMarker: {
    fontSize: 12,
    color: '#9da8b9',
  },
  generateButton: {
    backgroundColor: '#6543cc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: 'rgba(101, 67, 204, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
    opacity: 0.7,
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
  results: {
    gap: 20,
  },
  outputCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
  outputHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outputHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  outputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    width: 100,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6543cc',
  },
  progressLabel: {
    fontSize: 12,
    color: '#9da8b9',
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputContent: {
    padding: 15,
    maxHeight: 300,
  },
  scenarioText: {
    color: '#e2e2e2',
    fontSize: 16,
    lineHeight: 24,
  },
  cursor: {
    color: '#6543cc',
    fontWeight: 'bold',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 15,
  },
  placeholderText: {
    color: '#9da8b9',
    fontSize: 16,
  },
  questionsCard: {
    backgroundColor: '#171a23',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2c3d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 20,
  },
  questionsHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c3d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
  questionsContent: {
    padding: 15,
  },
  assessmentComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 187, 119, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    gap: 15,
  },
  assessmentResults: {
    flex: 1,
  },
  completionMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e2e2e2',
    marginBottom: 5,
  },
  scoreMessage: {
    fontSize: 14,
    color: '#9da8b9',
  },
  questionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6543cc',
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  correctStatus: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
  },
  incorrectStatus: {
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  correctText: {
    color: '#2ebb77',
  },
  incorrectText: {
    color: '#ff4e4e',
  },
  questionText: {
    fontSize: 16,
    color: '#e2e2e2',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#2a2c3d',
    borderRadius: 10,
    padding: 12,
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
    marginRight: 12,
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
    fontSize: 15,
    lineHeight: 22,
  },
  optionIcon: {
    marginLeft: 10,
  },
  feedbackContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    gap: 12,
  },
  feedbackIcon: {
    marginTop: 2,
  },
  feedbackExplanation: {
    flex: 1,
    fontSize: 14,
    color: '#9da8b9',
    lineHeight: 22,
  },
});

export default ScenarioSphereScreen;
