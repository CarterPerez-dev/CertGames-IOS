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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { useToast } from 'react-native-toast-notifications';
import { streamAnalogy } from '../../api/analogyService';

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
  // States
  const [analogyType, setAnalogyType] = useState('single');
  const [inputValues, setInputValues] = useState(['']);

  const [analogyCategory, setAnalogyCategory] = useState('real-world');

  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedAnalogy, setGeneratedAnalogy] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const toast = useToast();
  const scrollViewRef = useRef();

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

  // "Generate" button
  const handleGenerateClick = async () => {
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

      // Scroll to the end if the output extends beyond the screen
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
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
    setAnalogyCategory(value);
    setShowCategoryModal(false);
  };

  // Renders each category item inside the modal's FlatList
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item.value)}
    >
      <Text style={styles.categoryItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  // Renders the row of "chips" for analogyType
  // "Single," "Comparison," "Triple"
  const renderTypeChips = () => (
    <View style={styles.chipRow}>
      {ANALOGY_TYPES.map((type) => {
        const isActive = analogyType === type.value;
        return (
          <TouchableOpacity
            key={type.value}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => setAnalogyType(type.value)}
            disabled={isStreaming}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analogy Hub</Text>
        <Text style={styles.subtitle}>runtime-error.r00</Text>
      </View>

      {/* Single ScrollView for entire screen */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        <View style={styles.formContainer}>
          {/* Analogy Type row */}
          <Text style={styles.sectionTitle}>1) Select Analogy Type</Text>
          {renderTypeChips()}

          {/* Input fields */}
          <Text style={styles.sectionTitle}>2) Enter Concepts</Text>
          <View style={styles.inputFields}>
            {inputValues.map((value, index) => (
              <TextInput
                key={index}
                style={styles.input}
                placeholder={`Enter concept ${index + 1}`}
                placeholderTextColor="#666"
                value={value}
                onChangeText={(text) => handleInputChange(index, text)}
                editable={!isStreaming}
              />
            ))}
          </View>

          {/* Category Selection */}
          <Text style={styles.sectionTitle}>3) Choose a Category</Text>
          <TouchableOpacity
            style={styles.selectCategoryButton}
            onPress={() => !isStreaming && setShowCategoryModal(true)}
            disabled={isStreaming}
          >
            <Ionicons name="list" size={18} color="#fff" />
            <Text style={styles.selectCategoryText}>
              {CATEGORY_OPTIONS.find((c) => c.value === analogyCategory)?.label || 'Select Category'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isStreaming && styles.generateButtonDisabled]}
            onPress={handleGenerateClick}
            disabled={isStreaming}
          >
            {isStreaming ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Generating...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Generate Analogy</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Output Area */}
        {(generatedAnalogy || isStreaming) && (
          <View style={styles.outputContainer}>
            {generatedAnalogy ? (
              <>
                <View style={styles.outputHeader}>
                  <Text style={styles.outputTitle}>Generated Analogy</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyClick}>
                    <Ionicons name="copy-outline" size={16} color="#fff" />
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.analogyTextContainer}>
                  <Text style={styles.analogyText}>{generatedAnalogy}</Text>
                </View>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#00ffea" size="large" />
                <Text style={styles.loadingText}>Generating analogy...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORY_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={renderCategoryItem}
              style={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 2,
    borderBottomColor: '#8B0000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4c8b',
    textShadowColor: 'rgba(255,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#00ffea',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    marginBottom: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#00ffea',
    marginBottom: 5,
    fontWeight: '600',
  },
  // CHIPS
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#333',
    borderColor: '#666',
    borderWidth: 1,
  },
  chipText: {
    color: '#bbb',
    fontSize: 14,
    fontWeight: '500',
  },
  chipActive: {
    backgroundColor: '#8B0000',
    borderColor: '#000',
  },
  chipTextActive: {
    color: '#fff',
  },

  // Input fields
  inputFields: {
    gap: 16,
  },
  input: {
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 10,
    color: '#00ffea',
    padding: 12,
    fontSize: 16,
  },

  // Category Button
  selectCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  selectCategoryText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },

  // Generate Button
  generateButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  generateButtonDisabled: {
    backgroundColor: '#550000',
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

  // Output container
  outputContainer: {
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B0000',
    padding: 15,
    marginTop: 10,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 0, 0.2)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  copyText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  analogyTextContainer: {},
  analogyText: {
    color: '#00ffea',
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#00ffea',
    marginTop: 10,
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8B0000',
    maxHeight: '80%',
    paddingBottom: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryList: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  categoryItemText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AnalogyHubScreen;

