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

const ResourceRandomModal = ({ 
  visible, 
  resource, 
  onClose, 
  onGetAnother, 
  isLoading 
}) => {
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
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.modalHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Resource Spotlight</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.resourceTitle}>{resource.name}</Text>
            
            <Text style={styles.modalDescription}>
              Expand your cybersecurity knowledge with this resource:
            </Text>
            
            <TouchableOpacity 
              style={styles.openButton} 
              onPress={handleOpenResource}
            >
              <Text style={styles.openButtonText}>Open Resource</Text>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.randomButton}
              onPress={onGetAnother}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="sync-outline" size={18} color="#FFFFFF" style={styles.spinIcon} />
                  <Text style={styles.randomButtonText}>Loading...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="shuffle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.randomButtonText}>Try Another</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width > 400 ? 380 : width - 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    backgroundColor: '#6543CC',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  modalDescription: {
    color: '#AAAAAA',
    marginBottom: 20,
    fontSize: 14,
  },
  openButton: {
    backgroundColor: '#6543CC',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  randomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  randomButtonText: {
    color: '#FFFFFF',
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
