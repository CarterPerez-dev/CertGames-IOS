// src/screens/shop/components/ColorItem.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ColorItem = ({ item, isPurchased, isEquipped }) => {
  const colorValue = item.effectValue || '#FFFFFF';
  
  // Function to determine if the color is light or dark
  const isLightColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if it's a light color (brightness > 128)
    return brightness > 128;
  };
  
  const textColor = isLightColor(colorValue) ? '#000000' : '#FFFFFF';
  
  return (
    <View style={styles.container}>
      <View style={[styles.colorBox, { backgroundColor: colorValue }]}>
        <Text style={[styles.colorName, { color: textColor }]}>
          {item.title}
        </Text>
        <Text style={[styles.colorLabel, { color: textColor }]}>
          Name Color
        </Text>
      </View>
      
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
  colorBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 14,
    opacity: 0.8,
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

export default ColorItem;
