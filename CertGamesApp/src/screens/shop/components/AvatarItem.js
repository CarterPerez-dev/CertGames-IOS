// src/screens/shop/components/AvatarItem.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AvatarItem = ({ item, isPurchased, isEquipped, theme }) => {
  const [imageError, setImageError] = useState(false);
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <View style={styles.container}>
      {/* Background for aesthetic enhancement */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={styles.gradientOverlay}
      />
      
      {/* Try to load the actual image, fallback to placeholder if it fails */}
      {item.imageUrl && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.avatarImage}
            onError={handleImageError}
          />
        </View>
      ) : (
        <View style={[
          styles.placeholderContainer, 
          { backgroundColor: theme ? theme.colors.surfaceHighlight : '#2A2A2A' }
        ]}>
          <Text style={[
            styles.placeholderText,
            { color: theme ? theme.colors.text : '#FFFFFF' }
          ]}>
            {item.title?.charAt(0) || '?'}
          </Text>
        </View>
      )}
      
      {isPurchased && (
        <View style={styles.badgeContainer}>
          <View style={[
            styles.badge,
            isEquipped ? 
            { backgroundColor: theme ? theme.colors.primary : '#6543CC' } : 
            { backgroundColor: theme ? theme.colors.success : '#2ebb77' }
          ]}>
            <Ionicons 
              name={isEquipped ? "checkmark-circle" : "checkmark"} 
              size={14} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 150,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    zIndex: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  avatarImage: {
    width: '85%', // Using percentage to prevent cutoff
    height: '85%', // Using percentage to prevent cutoff
    resizeMode: 'contain',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AvatarItem;
