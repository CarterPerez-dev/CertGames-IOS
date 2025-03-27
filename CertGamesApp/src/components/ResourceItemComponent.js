// src/components/ResourceItemComponent.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const ResourceItemComponent = ({ resource, listMode = false }) => {
  // Access theme
  const { theme } = useTheme();
  
  // Function to get the source icon based on URL or name
  const getSourceIcon = () => {
    const { url, name } = resource;
    
    if (url.includes('reddit.com')) return { name: 'logo-reddit', color: '#FF4500' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { name: 'logo-youtube', color: '#FF0000' };
    if (url.includes('udemy.com')) return { name: 'school-outline', color: '#A435F0' };
    if (url.includes('linkedin.com')) return { name: 'logo-linkedin', color: '#0077B5' };
    if (url.includes('github.com')) return { name: 'logo-github', color: '#6E5494' };
    if (url.includes('comptia.org') || name.toLowerCase().includes('comptia') || name.toLowerCase().includes('a+') || name.toLowerCase().includes('network+') || name.toLowerCase().includes('security+')) 
      return { name: 'document-text-outline', color: '#C80024' };
    if (name.toLowerCase().includes('pentest') || name.toLowerCase().includes('nmap') || name.toLowerCase().includes('kali'))
      return { name: 'construct-outline', color: '#00B0FF' };
    if (url.includes('aws.amazon.com') || name.toLowerCase().includes('aws') || name.toLowerCase().includes('amazon web') || name.toLowerCase().includes('cloud practitioner'))
      return { name: 'cloud-outline', color: '#FF9900' };
    if (name.toLowerCase().includes('cissp') || name.toLowerCase().includes('isc2') || url.includes('isc2.org'))
      return { name: 'shield-checkmark-outline', color: '#2C5773' };
    
    // Default icon
    return { name: 'link-outline', color: theme.colors.primary };
  };
  
  const openURL = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      const canOpen = await Linking.canOpenURL(resource.url);
      if (canOpen) {
        await Linking.openURL(resource.url);
      } else {
        console.error('Cannot open URL:', resource.url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };
  
  const sourceIcon = getSourceIcon();
  
  // List mode is more compact for narrow displays
  if (listMode) {
    return (
      <TouchableOpacity 
        style={[
          styles.listItem, 
          { 
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.divider,
            borderColor: theme.colors.border,
            borderWidth: 1,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }
        ]} 
        onPress={openURL}
        activeOpacity={0.7}
      >
        <View style={[styles.listIconContainer, { backgroundColor: sourceIcon.color + '20' }]}>
          <Ionicons name={sourceIcon.name} size={18} color={sourceIcon.color} />
        </View>
        <Text 
          style={[styles.listText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {resource.name}
        </Text>
        <View style={[styles.listArrow, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.icon} />
        </View>
      </TouchableOpacity>
    );
  }
  
  // Card mode is more visual
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 3,
        }
      ]} 
      onPress={openURL}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[sourceIcon.color + '20', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: sourceIcon.color + '20' }]}>
            <Ionicons name={sourceIcon.name} size={22} color={sourceIcon.color} />
          </View>
          <View style={styles.textContainer}>
            <Text 
              style={[styles.title, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]} 
              numberOfLines={2} 
              ellipsizeMode="tail"
            >
              {resource.name}
            </Text>
          </View>
          <View style={[styles.arrowContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
            <Ionicons name="open-outline" size={18} color={theme.colors.icon} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Card mode styles
  card: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  // List mode styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  listArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResourceItemComponent;
