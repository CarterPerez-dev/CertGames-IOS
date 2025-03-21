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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useToast } from 'react-native-toast-notifications';
import { streamAnalogy } from '../../api/analogyService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

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
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

  // States
  const [analogyType, setAnalogyType] = useState('single');
  const [inputValues, setInputValues] = useState(['']);
  const [analogyCategory, setAnalogyCategory] = useState('real-world');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedAnalogy, setGeneratedAnalogy] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const toast = useToast();
  const scrollViewRef = useRef();
  const outputRef = useRef();

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
      toast.show('Please enter at least one concept', {
        type: 'danger',
        duration: 3000,
      });
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
        if (outputRef.current) {
          outputRef.current.measureLayout(
            scrollViewRef.current.getInnerViewNode(),
            (x, y) => {
              scrollViewRef.current.scrollTo({ y, animated: true });
            },
            () => {}
          );
        }
      }, 300);
    } catch (error) {
      console.error('Error generating analogy:', error);
      toast.show('Error generating analogy. Please try again.', {
        type: 'danger',
        duration: 3000,
      });
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
        
        toast.show('Copied to clipboard!', {
          type: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.show('Failed to copy to clipboard', {
          type: 'danger',
          duration: 3000,
        });
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
      <Text style={[styles.categoryItemText, { color: theme.colors.text }]}>
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

      {/* Header */}
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              <Ionicons name="bulb" size={28} color={theme.colors.primary} /> Analogy Hub
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Create powerful analogies to explain complex concepts
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Parameters Card */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Configuration</Text>
          </View>

          {/* Analogy Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              1. Select Analogy Type
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
                        backgroundColor: isActive ? theme.colors.primary : 'rgba(0,0,0,0.2)'
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
                        { color: isActive ? theme.colors.buttonText : theme.colors.textSecondary }
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Input fields */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              2. Enter Concepts
            </Text>
            <View style={styles.inputFields}>
              {inputValues.map((value, index) => (
                <View key={index} style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Concept {index + 1}
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.inputText,
                        borderColor: isInputFocused === index ? 
                          theme.colors.primary : theme.colors.inputBorder
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
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              3. Choose a Category
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
              <Text style={[styles.selectCategoryText, { color: theme.colors.inputText }]}>
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
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                  Generating...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="flash" size={20} color={theme.colors.buttonText} />
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                  Generate Analogy
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Output Area */}
        {(generatedAnalogy || isStreaming) && (
          <View 
            ref={outputRef}
            style={[
              styles.outputCard, 
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border 
              }
            ]}
          >
            <View style={styles.outputHeader}>
              <View style={styles.outputTitleContainer}>
                <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                <Text style={[styles.outputTitle, { color: theme.colors.text }]}>
                  Generated Analogy
                </Text>
              </View>
              
              {generatedAnalogy && (
                <TouchableOpacity 
                  style={[
                    styles.copyButton, 
                    { backgroundColor: theme.colors.buttonSecondary }
                  ]} 
                  onPress={handleCopyClick}
                >
                  <Ionicons name="copy-outline" size={16} color={theme.colors.buttonText} />
                  <Text style={[styles.copyText, { color: theme.colors.buttonText }]}>Copy</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.outputContentWrapper}>
              {generatedAnalogy ? (
                <View style={[
                  styles.analogyTextContainer, 
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  }
                ]}>
                  <Text style={[styles.analogyText, { color: theme.colors.text }]}>
                    {generatedAnalogy}
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={theme.colors.primary} size="large" />
                  <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Generating analogy...
                  </Text>
                  <Text style={[styles.loadingSubtext, { color: theme.colors.textMuted }]}>
                    This may take a moment to craft the perfect comparison.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Tip Card */}
        {!generatedAnalogy && !isStreaming && (
          <View style={[
            styles.tipCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={22} color={theme.colors.warning} />
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Tips</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • For "Single" type, enter a complex concept you want explained.
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • For "Comparison" type, enter two concepts to compare.
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • For "Triple" type, enter the third concept as the target domain.
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Choose a category that relates to your audience's interest.
              </Text>
            </View>
          </View>
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.buttonText }]}>
                Select a Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.buttonText} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORY_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={renderCategoryItem}
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : RNStatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputFields: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
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
  generateButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Output container
  outputCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  outputTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  outputContentWrapper: {
    padding: 16,
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  // Tip card
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipContent: {
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
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
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
});

export default AnalogyHubScreen;
