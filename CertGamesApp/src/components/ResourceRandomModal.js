// src/components/ResourceRandomModal.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  
  useEffect(() => {
    if (visible) {
      // Reset animations when modal becomes visible
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
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
      ]).start();
    }
  }, [visible, resource]);
  
  const handleOpenResource = async () => {
    if (resource && resource.url) {
      try {
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
    ]).start(() => {
      onClose();
    });
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
              transform: [{ translateY: slideAnim }],
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.colors.surfaceHighlight }]} 
            onPress={handleClose}
          >
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="bulb-outline" size={24} color={theme.colors.textInverse} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.textInverse }]}>Resource Spotlight</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.resourceTitle, { color: theme.colors.text }]}>{resource.name}</Text>
            
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Expand your cybersecurity knowledge with this resource:
            </Text>
            
            <TouchableOpacity 
              style={[styles.openButton, { backgroundColor: theme.colors.primary }]} 
              onPress={handleOpenResource}
            >
              <Text style={[styles.openButtonText, { color: theme.colors.textInverse }]}>Open Resource</Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.textInverse} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.randomButton, 
                { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderColor: theme.colors.border
                }
              ]}
              onPress={onGetAnother}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="sync-outline" size={18} color={theme.colors.text} style={styles.spinIcon} />
                  <Text style={[styles.randomButtonText, { color: theme.colors.text }]}>Loading...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="shuffle-outline" size={18} color={theme.colors.text} />
                  <Text style={[styles.randomButtonText, { color: theme.colors.text }]}>Try Another</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width > 400 ? 380 : width - 40,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalDescription: {
    marginBottom: 20,
    fontSize: 14,
  },
  openButton: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  openButtonText: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
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
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinIcon: {
    transform: [{ rotate: '0deg' }],
  },
});

export default ResourceRandomModal;
