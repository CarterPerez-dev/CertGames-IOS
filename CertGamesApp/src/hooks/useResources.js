// src/hooks/useResources.js
import { useState, useEffect, useCallback } from 'react';
import { RESOURCES_DATA } from '../constants/resourcesConstants';
import ResourcesService from '../api/ResourcesService';
import { useTheme } from '../context/ThemeContext';

/**
 * Custom hook for managing resources data
 * @param {string} initialCategory - Initial resource category to load
 * @returns {Object} Resources state and methods
 */
const useResources = (initialCategory = 'all') => {
  const { theme } = useTheme(); // Access theme context
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showCertCategories, setShowCertCategories] = useState(false);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  
  // Random resource state
  const [randomResource, setRandomResource] = useState(null);
  const [loadingRandom, setLoadingRandom] = useState(false);
  
  // Load resources for the selected category
  const loadResources = useCallback((categoryId = selectedCategory) => {
    setLoading(true);
    
    // Since resources are stored locally in constants, we simulate API call
    setTimeout(() => {
      const categoryResources = RESOURCES_DATA[categoryId] || [];
      setResources(categoryResources);
      setLoading(false);
    }, 300);
    
    // If backend API is implemented, use this instead:
    // ResourcesService.fetchResourcesByCategory(categoryId)
    //   .then(data => {
    //     setResources(data);
    //     setLoading(false);
    //   })
    //   .catch(error => {
    //     console.error('Error fetching resources:', error);
    //     setLoading(false);
    //   });
  }, [selectedCategory]);
  
  // Load resources when category changes
  useEffect(() => {
    loadResources(selectedCategory);
  }, [selectedCategory, loadResources]);
  
  // Filter and sort resources when search term, resources, or sort preference changes
  useEffect(() => {
    let filtered = resources;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = resources.filter(
        resource => resource.name.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (sortAlphabetically) {
      filtered = [...filtered].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    }
    
    setFilteredResources(filtered);
  }, [resources, searchTerm, sortAlphabetically]);
  
  // Get a random resource
  const getRandomResource = useCallback(() => {
    setLoadingRandom(true);
    
    // Create a slight delay for UX
    setTimeout(() => {
      const availableResources = filteredResources.length > 0 
        ? filteredResources 
        : resources;
      
      if (availableResources.length === 0) {
        setLoadingRandom(false);
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * availableResources.length);
      const resource = availableResources[randomIndex];
      setRandomResource(resource);
      setLoadingRandom(false);
      return resource;
    }, 400);
  }, [filteredResources, resources]);
  
  // Toggle between resource types and certifications
  const toggleCertCategories = useCallback(() => {
    setShowCertCategories(prev => !prev);
    setSelectedCategory('all'); // Reset selected category
  }, []);
  
  // Toggle sort
  const toggleSort = useCallback(() => {
    setSortAlphabetically(prev => !prev);
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortAlphabetically(false);
  }, []);
  
  return {
    // State
    searchTerm,
    selectedCategory,
    showCertCategories,
    resources,
    filteredResources,
    loading,
    sortAlphabetically,
    randomResource,
    loadingRandom,
    
    // Setters
    setSearchTerm,
    setSelectedCategory,
    
    // Actions
    loadResources,
    getRandomResource,
    toggleCertCategories,
    toggleSort,
    clearFilters,
    
    // Theme-related properties
    theme, // Pass through theme for components that don't directly use useTheme
  };
};

export default useResources;
