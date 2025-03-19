// src/screens/shop/components/AvatarItem.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AvatarItem = ({ item, isPurchased, isEquipped }) => {
  const [imageError, setImageError] = useState(false);
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <View style={styles.container}>
      {/* Try to load the actual image, fallback to placeholder if it fails */}
      {item.imageUrl && !imageError ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.avatarImage}
          onError={handleImageError}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {item.title?.charAt(0) || '?'}
          </Text>
        </View>
      )}
      
      {isPurchased && (
        <View style={styles.ownershipBadgeContainer}>
          <View style={[
            styles.ownershipBadge,
            isEquipped ? styles.equippedBadge : styles.purchasedBadge
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
    height: 140,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2A2A2A',
  },
  placeholderContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ownershipBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  ownershipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasedBadge: {
    backgroundColor: '#2ebb77',
  },
  equippedBadge: {
    backgroundColor: '#6543CC',
  },
});

export default AvatarItem;
