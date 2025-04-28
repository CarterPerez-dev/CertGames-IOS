// src/components/ResourcePremiumBanner.js - Compact version
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ResourcePremiumBanner = ({ theme }) => {
  const navigation = useNavigation();
 


  return (
    <View style={[styles.banner, { borderColor: theme.colors.primary + '40', backgroundColor: theme.colors.primary + '15' }]}>
      <Ionicons name="diamond" size={16} color={theme.colors.goldBadge} />
      <Text style={[styles.text, { color: theme.colors.primary}]}>
        PREMIUM FEATURE
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('PremiumFeaturePrompt', { feature: 'resources' })}
      >
        <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>UPGRADE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    marginTop: 32,
  },
  text: {
    flex: 1,
    fontSize: 13,
    marginLeft: 48,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 2,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '600',
  }
});

export default ResourcePremiumBanner;
