// src/screens/tools/AnalogyHubScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { streamAnalogy } from '../../api/analogyService';
import { useToast } from 'react-native-toast-notifications';

const AnalogyHubScreen = () => {
  const [analogyType, setAnalogyType] = useState('single');
  const [inputValues, setInputValues] = useState(['']);
  const [analogyCategory, setAnalogyCategory] = useState('real-world');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedAnalogy, setGeneratedAnalogy] = useState('');
  
  const toast = useToast();
  const scrollViewRef = useRef();

  // Update input fields based on analogy type
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

  const handleInputChange = (index, value) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
  };

  const handleGenerateAnalogy = async () => {
    Keyboard.dismiss();
    setIsStreaming(true);
    setGeneratedAnalogy('');

    try {
      const data = {
        analogy_type: analogyType,
        category: analogyCategory,
        concept1: inputValues[0] || '',
        concept2: inputValues[1] || '',
        concept3: inputValues[2] || ''
      };
      
      // Use the service to stream the analogy
      const textChunks = await streamAnalogy(
        analogyType,
        inputValues[0],
        inputValues[1] || '',
        inputValues[2] || '',
        analogyCategory
      );
      
      let accumulatedText = '';
      
      // Simulate streaming by updating the text in chunks
      for (const chunk of textChunks.split('\n')) {
        accumulatedText += chunk + '\n';
        setGeneratedAnalogy(accumulatedText);
        
        // Scroll to bottom as text comes in
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error generating analogy:', error);
      toast.show('An error occurred while generating the analogy', {
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedAnalogy) {
      await Clipboard.setStringAsync(generatedAnalogy);
      toast.show('Copied to clipboard!', {
        type: 'success',
        duration: 2000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Analogy Hub</Text>
        <Text style={styles.subtitle}>runtime-error.r00</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Analogy Type Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Analogy Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={analogyType}
                onValueChange={(value) => setAnalogyType(value)}
                style={styles.picker}
                dropdownIconColor="#00ffea"
                itemStyle={styles.pickerItem}
                enabled={!isStreaming}
              >
                <Picker.Item label="Single" value="single" />
                <Picker.Item label="Comparison" value="comparison" />
                <Picker.Item label="Triple Comparison" value="triple" />
              </Picker>
            </View>
          </View>
          
          {/* Input Fields */}
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
          
          {/* Category Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={analogyCategory}
                onValueChange={(value) => setAnalogyCategory(value)}
                style={styles.picker}
                dropdownIconColor="#00ffea"
                itemStyle={styles.pickerItem}
                enabled={!isStreaming}
              >
                <Picker.Item label="Real World Analogy" value="real-world" />
                <Picker.Item label="Video Games" value="video-games" />
                <Picker.Item label="TV Show" value="tv-show" />
                <Picker.Item label="Sports" value="sports" />
                <Picker.Item label="Fiction" value="fiction" />
                <Picker.Item label="Food & Cooking" value="food" />
                <Picker.Item label="Relationships" value="relationships" />
                <Picker.Item label="Music & Instruments" value="music" />
                <Picker.Item label="Animals" value="animals" />
                <Picker.Item label="Nature & Environment" value="nature" />
                <Picker.Item label="Travel & Exploration" value="travel" />
                <Picker.Item label="Historical Events" value="history" />
                <Picker.Item label="Technology" value="technology" />
                <Picker.Item label="Mythology" value="mythology" />
                <Picker.Item label="Business & Economics" value="business" />
                <Picker.Item label="Art & Creativity" value="art" />
                <Picker.Item label="School & Education" value="school" />
                <Picker.Item label="Construction & Engineering" value="construction" />
                <Picker.Item label="Space & Astronomy" value="space" />
                <Picker.Item label="Superheroes & Comic Books" value="superheroes" />
                <Picker.Item label="Medieval Times" value="medieval" />
                <Picker.Item label="Movies & Cinema" value="movies" />
                <Picker.Item label="Everyday Life" value="everyday-life" />
                <Picker.Item label="Gardening" value="gardening" />
                <Picker.Item label="Mr Robot" value="mr-robot" />
              </Picker>
            </View>
          </View>
          
          {/* Generate Button */}
          <TouchableOpacity 
            style={[styles.generateButton, isStreaming && styles.generateButtonDisabled]} 
            onPress={handleGenerateAnalogy}
            disabled={isStreaming}
          >
            {isStreaming ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Streaming...</Text>
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
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={copyToClipboard}
                  >
                    <Ionicons name="copy-outline" size={16} color="#fff" />
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.analogyTextContainer}
                  contentContainerStyle={styles.analogyTextContent}
                >
                  <Text style={styles.analogyText}>{generatedAnalogy}</Text>
                </ScrollView>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerContainer: {
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#00ffea',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 10,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  picker: {
    color: '#00ffea',
    backgroundColor: '#222',
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
    color: '#00ffea',
  },
  inputFields: {
    gap: 16,
    marginBottom: 16,
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
  generateButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    marginTop: 10,
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
  outputContainer: {
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B0000',
    padding: 15,
    marginTop: 20,
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
  analogyTextContainer: {
    maxHeight: 300,
  },
  analogyTextContent: {
    paddingVertical: 10,
  },
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
});

export default AnalogyHubScreen;
