// src/components/ResourceRandomModal.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ResourceRandomModal = ({ 
  visible, 
  resource, 
  onClose, 
  onGetAnother, 
  isLoading 
}) => {
  // Access theme
  const { theme } = useTheme();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations when modal becomes visible
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, resource]);
  
  const handleOpenResource = async () => {
    if (resource && resource.url) {
      try {
        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        const canOpen = await Linking.canOpenURL(resource.url);
        if (canOpen) {
          await Linking.openURL(resource.url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };
  
  // Animation when closing
  const handleClose = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };
  
  // Get icon for resource type
  const getResourceIcon = () => {
    if (!resource) return 'link-outline';
    
    const { url, name } = resource;
    
    if (url.includes('reddit.com')) return 'logo-reddit';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'logo-youtube';
    if (url.includes('udemy.com')) return 'school-outline';
    if (url.includes('linkedin.com')) return 'logo-linkedin';
    if (url.includes('github.com')) return 'logo-github';
    if (url.includes('comptia.org') || name.toLowerCase().includes('comptia') || name.toLowerCase().includes('a+') || name.toLowerCase().includes('network+') || name.toLowerCase().includes('security+')) 
      return 'document-text-outline';
    if (name.toLowerCase().includes('pentest') || name.toLowerCase().includes('nmap') || name.toLowerCase().includes('kali'))
      return 'construct-outline';
    if (url.includes('aws.amazon.com') || name.toLowerCase().includes('aws') || name.toLowerCase().includes('amazon web') || name.toLowerCase().includes('cloud practitioner'))
      return 'cloud-outline';
    if (name.toLowerCase().includes('cissp') || name.toLowerCase().includes('isc2') || url.includes('isc2.org'))
      return 'shield-checkmark-outline';
    
    return 'bulb-outline'; // Default icon
  };
  
  if (!resource) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.shadow,
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.colors.surfaceHighlight }]} 
            onPress={handleClose}
          >
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          
          <LinearGradient
            colors={theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name={getResourceIcon()} size={24} color={theme.colors.buttonText} />
            </View>
            <Text style={[styles.modalTitle, { 
              color: theme.colors.buttonText, 
              fontFamily: 'Orbitron-Bold' 
            }]}>
              RESOURCE SPOTLIGHT
            </Text>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <Text style={[styles.resourceTitle, { 
              color: theme.colors.text,
              fontFamily: 'ShareTechMono'
            }]}>
              {resource.name}
            </Text>
            
            <View style={[styles.descriptionBox, { 
              backgroundColor: theme.colors.surfaceHighlight,
              borderColor: theme.colors.border,
              borderWidth: 1,
            }]}>
              <Text style={[styles.modalDescription, { 
                color: theme.colors.textSecondary,
                fontFamily: 'ShareTechMono'
              }]}>
                Expand your cybersecurity knowledge with this curated resource from our database.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.openButton, { backgroundColor: theme.colors.primary }]} 
              onPress={handleOpenResource}
            >
              <Text style={[styles.openButtonText, { 
                color: theme.colors.buttonText,
                fontFamily: 'Orbitron'
              }]}>
                OPEN RESOURCE
              </Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.buttonText} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.randomButton, 
                { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => {
                // Haptic feedback
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onGetAnother();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View 
                    style={{
                      transform: [{
                        rotate: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}
                  >
                    <Ionicons name="sync-outline" size={18} color={theme.colors.text} />
                  </Animated.View>
                  <Text style={[styles.randomButtonText, { 
                    color: theme.colors.text,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    LOADING...
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
                  <Text style={[styles.randomButtonText, { 
                    color: theme.colors.text,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    TRY ANOTHER
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width > 400 ? 380 : width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalBody: {
    padding: 20,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  descriptionBox: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  openButton: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  openButtonText: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
    letterSpacing: 1,
  },
  randomButton: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  randomButtonText: {
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ResourceRandomModal;
