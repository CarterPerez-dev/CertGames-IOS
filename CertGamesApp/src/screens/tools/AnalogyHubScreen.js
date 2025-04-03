// src/screens/tools/AnalogyHubScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  FlatList,
  Modal,
  StatusBar as RNStatusBar,
  Dimensions,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { streamAnalogy } from '../../api/analogyService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// We'll keep the categories array for our modal list
const CATEGORY_OPTIONS = [
  { label: 'Real World Analogy', value: 'real-world' },
  { label: 'Video Games', value: 'video-games' },
  { label: 'TV Show', value: 'tv-show' },
  { label: 'Sports', value: 'sports' },
  { label: 'Fiction', value: 'fiction' },
  { label: 'Food & Cooking', value: 'food' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Music & Instruments', value: 'music' },
  { label: 'Animals', value: 'animals' },
  { label: 'Nature & Environment', value: 'nature' },
  { label: 'Travel & Exploration', value: 'travel' },
  { label: 'Historical Events', value: 'history' },
  { label: 'Technology', value: 'technology' },
  { label: 'Mythology', value: 'mythology' },
  { label: 'Business & Economics', value: 'business' },
  { label: 'Art & Creativity', value: 'art' },
  { label: 'School & Education', value: 'school' },
  { label: 'Construction & Engineering', value: 'construction' },
  { label: 'Space & Astronomy', value: 'space' },
  { label: 'Superheroes & Comic Books', value: 'superheroes' },
  { label: 'Medieval Times', value: 'medieval' },
  { label: 'Movies & Cinema', value: 'movies' },
  { label: 'Everyday Life', value: 'everyday-life' },
  { label: 'Gardening', value: 'gardening' },
  { label: 'Mr Robot', value: 'mr-robot' },
];

// We'll map these for the "chips" row
const ANALOGY_TYPES = [
  { label: 'Single', value: 'single' },
  { label: 'Comparison', value: 'comparison' },
  { label: 'Triple', value: 'triple' },
];

const AnalogyHubScreen = () => {
  const navigation = useNavigation();
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState([...Array(5)].map(() => new Animated.Value(0)));

  // States
  const [analogyType, setAnalogyType] = useState('single');
  const [inputValues, setInputValues] = useState(['']);
  const [analogyCategory, setAnalogyCategory] = useState('real-world');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedAnalogy, setGeneratedAnalogy] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const scrollViewRef = useRef();
  const outputContainerRef = useRef();

  // Animation on mount
  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Staggered card animations
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (i * 120),
        useNativeDriver: true
      }).start();
    });
  }, []);

  // Update input fields based on analogyType
  useEffect(() => {
    switch (analogyType) {
      case 'comparison':
        setInputValues(['', '']);
        break;
      case 'triple':
        setInputValues(['', '', '']);
        break;
      default:
        setInputValues(['']);
    }
  }, [analogyType]);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Input handlers
  const handleInputChange = (index, value) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
  };

  // Find category label by value
  const getCategoryLabel = (value) => {
    const category = CATEGORY_OPTIONS.find(cat => cat.value === value);
    return category ? category.label : 'Select Category';
  };

  // "Generate" button
  const handleGenerateClick = async () => {
    // Check if we have at least one input with content
    if (!inputValues.some(value => value.trim().length > 0)) {
      Alert.alert('Error', 'Please enter at least one concept');
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    setIsStreaming(true);
    setGeneratedAnalogy('');

    try {
      const analogyData = await streamAnalogy(
        analogyType,
        inputValues[0] || '',
        inputValues[1] || '',
        inputValues[2] || '',
        analogyCategory
      );
      
      setGeneratedAnalogy(analogyData);

      // Scroll to the output
      setTimeout(() => {
        if (scrollViewRef.current && outputContainerRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
    } catch (error) {
      console.error('Error generating analogy:', error);
      Alert.alert('Error', 'Error generating analogy. Please check your network connection.');
    } finally {
      setIsStreaming(false);
    }
  };

  // Copy to clipboard
  const handleCopyClick = async () => {
    if (generatedAnalogy) {
      try {
        await Clipboard.setStringAsync(generatedAnalogy);
        
        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        setCopySuccess(true);
        Alert.alert('Success', 'Copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    }
  };

  // This handles selecting a category from the modal
  const handleCategorySelect = (value) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    setAnalogyCategory(value);
    setShowCategoryModal(false);
  };

  // Renders each category item inside the modal's FlatList
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem, 
        { 
          borderBottomColor: theme.colors.border,
          backgroundColor: item.value === analogyCategory ? 
            `${theme.colors.primary}20` : 'transparent'
        }
      ]}
      onPress={() => handleCategorySelect(item.value)}
    >
      <Text style={[styles.categoryItemText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
        {item.label}
      </Text>
      {item.value === analogyCategory && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[globalStyles.screen, styles.safeArea]}>
      <StatusBar style="light" />

      {/* Fixed back button in top left */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section with Title */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent']}
            start={{x: 0.5, y: 0}}
            end={{x: 0.5, y: 1}}
            style={styles.headerBackground}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.mainTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                <Text style={{ color: theme.colors.primary }}>ANALOGY</Text> HUB
              </Text>
              <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                CREATE POWERFUL ANALOGIES TO EXPLAIN COMPLEX CONCEPTS
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Parameters Card */}
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
                CONFIGURATION
              </Text>
            </View>
            
            <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="settings" size={22} color={theme.colors.buttonText} />
            </View>
          </View>
          
          <View style={[styles.card, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            marginHorizontal: 15
          }]}>
            <View style={styles.cardContent}>
              {/* Analogy Type Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  1. SELECT ANALOGY TYPE
                </Text>
                <View style={styles.chipRow}>
                  {ANALOGY_TYPES.map((type) => {
                    const isActive = analogyType === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.chip,
                          { 
                            borderColor: theme.colors.border,
                            backgroundColor: isActive ? theme.colors.primary : theme.colors.inputBackground
                          }
                        ]}
                        onPress={() => {
                          // Haptic feedback
                          if (Platform.OS === 'ios') {
                            Haptics.selectionAsync();
                          }
                          setAnalogyType(type.value);
                        }}
                        disabled={isStreaming}
                      >
                        <Text 
                          style={[
                            styles.chipText, 
                            { 
                              color: isActive ? theme.colors.buttonText : theme.colors.textSecondary,
                              fontFamily: 'ShareTechMono'
                            }
                          ]}
                        >
                          {type.label.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Input fields for concepts */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  2. ENTER CONCEPTS
                </Text>
                <View style={styles.inputFields}>
                  {inputValues.map((value, index) => (
                    <View key={index} style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                        CONCEPT {index + 1}
                      </Text>
                      <TextInput
                        style={[
                          styles.input, 
                          { 
                            backgroundColor: theme.colors.inputBackground,
                            color: theme.colors.inputText,
                            borderColor: isInputFocused === index ? 
                              theme.colors.primary : theme.colors.inputBorder,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder={`Enter concept ${index + 1}`}
                        placeholderTextColor={theme.colors.placeholder}
                        value={value}
                        onChangeText={(text) => handleInputChange(index, text)}
                        onFocus={() => setIsInputFocused(index)}
                        onBlur={() => setIsInputFocused(false)}
                        editable={!isStreaming}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  3. CHOOSE A CATEGORY
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectCategoryButton, 
                    { 
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder
                    }
                  ]}
                  onPress={() => !isStreaming && setShowCategoryModal(true)}
                  disabled={isStreaming}
                >
                  <Ionicons name="albums-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.selectCategoryText, { color: theme.colors.inputText, fontFamily: 'ShareTechMono' }]}>
                    {getCategoryLabel(analogyCategory)}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.colors.inputText} />
                </TouchableOpacity>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton, 
                  { backgroundColor: theme.colors.buttonPrimary },
                  isStreaming && { opacity: 0.7 }
                ]}
                onPress={handleGenerateClick}
                disabled={isStreaming}
              >
                {isStreaming ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={theme.colors.buttonText} size="small" />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                      GENERATING...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="flash" size={20} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                      GENERATE ANALOGY
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Output Area */}
        {(generatedAnalogy || isStreaming) && (
          <Animated.View 
            ref={outputContainerRef}
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
                  GENERATED ANALOGY
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.toolCard }]}>
                <Ionicons name="bulb" size={22} color={theme.colors.buttonText} />
              </View>
            </View>
            
            <View style={[styles.outputCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              marginHorizontal: 15
            }]}>
              <LinearGradient
                colors={[theme.colors.toolCard, theme.colors.toolCard + '80']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.outputHeader}
              >
                <View style={styles.outputTitleContainer}>
                  <Ionicons name="bulb" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.outputTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                    ANALOGY
                  </Text>
                </View>
                
                {generatedAnalogy && (
                  <TouchableOpacity 
                    style={[
                      styles.copyButton, 
                      { backgroundColor: copySuccess ? theme.colors.success : 'rgba(0, 0, 0, 0.3)' }
                    ]} 
                    onPress={handleCopyClick}
                  >
                    <Ionicons 
                      name={copySuccess ? "checkmark-outline" : "copy-outline"} 
                      size={16} 
                      color={theme.colors.buttonText} 
                    />
                    <Text style={[styles.copyText, { color: theme.colors.buttonText, fontFamily: 'ShareTechMono' }]}>
                      {copySuccess ? "COPIED" : "COPY"}
                    </Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
              
              <View style={styles.outputContentWrapper}>
                {generatedAnalogy ? (
                  <View style={[
                    styles.analogyTextContainer, 
                    { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border
                    }
                  ]}>
                    <Text style={[styles.analogyText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                      {generatedAnalogy}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={theme.colors.primary} size="large" />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontFamily: 'Orbitron' }]}>
                      GENERATING ANALOGY...
                    </Text>
                    <Text style={[styles.loadingSubtext, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                      THIS MAY TAKE A MOMENT TO CRAFT THE PERFECT COMPARISON.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Tip Card */}
        {!generatedAnalogy && !isStreaming && (
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
            <View style={[styles.tipCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              marginHorizontal: 15
            }]}>
              <LinearGradient
                colors={[theme.colors.secondary, theme.colors.secondary + '80']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.tipHeader}
              >
                <Ionicons name="bulb" size={20} color={theme.colors.buttonText} />
                <Text style={[styles.tipTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                  USAGE TIPS
                </Text>
              </LinearGradient>
              
              <View style={styles.tipContent}>
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    SINGLE TYPE
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    ENTER A COMPLEX CONCEPT YOU WANT EXPLAINED AS AN ANALOGY
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    COMPARISON TYPE
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    ENTER TWO CONCEPTS TO CREATE AN ANALOGY COMPARING THEIR SIMILARITIES AND DIFFERENCES
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    TRIPLE COMPARISON
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    ENTER THREE CONCEPTS TO EXPLORE COMPLEX RELATIONSHIPS BETWEEN THEM
                  </Text>
                </View>
                
                <View style={[styles.tipItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.tipItemTitle, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron'
                  }]}>
                    CATEGORY SELECTION
                  </Text>
                  <Text style={[styles.tipText, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    CHOOSE A CATEGORY THAT RELATES TO YOUR INTERESTS FOR MORE EFFECTIVE MEMORIZATION
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.fullScreenModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalCenteredContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[
                styles.modalContent, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + '80']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.modalHeader}
                >
                  <Text style={[styles.modalTitle, { 
                    color: theme.colors.buttonText,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    SELECT A CATEGORY
                  </Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </LinearGradient>

                <FlatList
                  data={CATEGORY_OPTIONS}
                  keyExtractor={(item) => item.value}
                  renderItem={renderCategoryItem}
                  style={styles.categoryList}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={10}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  // Header with title
  headerContainer: {
    width: '100%',
    height: 150,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 25,
  },
  // Back button
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Section headers
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
  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardContent: {
    padding: 20,
  },
  // Configuration sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  // Chip selection
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Input fields
  inputFields: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  // Category selection
  selectCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  selectCategoryText: {
    fontSize: 16,
    flex: 1,
  },
  // Generate button
  generateButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Output card
  outputCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  outputTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  outputContentWrapper: {
    padding: 20,
  },
  analogyTextContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  analogyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Tips card
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tipContent: {
    padding: 16,
    gap: 12,
  },
  tipItem: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  tipItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  // Modal
  // Modal styles
  fullScreenModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCenteredContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '95%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  categoryList: {
    padding: 8,
    maxHeight: height * 0.6,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  categoryItemText: {
    fontSize: 16,
  },
  // Bottom padding
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
});

export default AnalogyHubScreen;
