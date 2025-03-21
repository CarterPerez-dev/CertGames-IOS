// src/components/ResourceItemComponent.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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
    if (url.includes('comptia.org') || name.includes('CompTIA') || name.includes('A+') || name.includes('Network+') || name.includes('Security+')) 
      return { name: 'document-text-outline', color: '#C80024' };
    if (name.toLowerCase().includes('pentest') || name.toLowerCase().includes('nmap') || name.toLowerCase().includes('kali'))
      return { name: 'construct-outline', color: '#00B0FF' };
    
    // Default icon
    return { name: 'link-outline', color: theme.colors.primary };
  };
  
  const openURL = async () => {
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
        style={[styles.listItem, { borderBottomColor: theme.colors.divider }]} 
        onPress={openURL}
      >
        <Ionicons name={sourceIcon.name} size={18} color={sourceIcon.color} style={styles.listIcon} />
        <Text 
          style={[styles.listText, { color: theme.colors.text }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {resource.name}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.icon} />
      </TouchableOpacity>
    );
  }
  
  // Card mode is more visual
  return (
    <TouchableOpacity 
      style={[styles.card, { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }]} 
      onPress={openURL}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${sourceIcon.color}20` }]}>
          <Ionicons name={sourceIcon.name} size={22} color={sourceIcon.color} />
        </View>
        <View style={styles.textContainer}>
          <Text 
            style={[styles.title, { color: theme.colors.text }]} 
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Card mode styles
  card: {
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    borderBottomWidth: 1,
  },
  listIcon: {
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
  },
});

export default ResourceItemComponent;
