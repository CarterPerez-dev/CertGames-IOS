// src/screens/shop/components/AvatarItem.js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AvatarItem = ({ item, isPurchased, isEquipped }) => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.avatarImage}
        resizeMode="cover"
      />
      
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
