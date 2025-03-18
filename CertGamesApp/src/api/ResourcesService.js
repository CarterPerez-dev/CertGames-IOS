// src/api/ResourcesService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

// This service could be expanded if you need to fetch resources from your backend
// Currently, resources are stored locally in the constants file
export const ResourcesService = {
  // Example API call if you need to fetch resources from backend
  fetchResourceCategories: async () => {
    try {
      const response = await apiClient.get(`${API.RESOURCES.CATEGORIES}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resource categories:', error);
      throw error;
    }
  },
  
  // Example API call if you need to fetch resources from backend
  fetchResourcesByCategory: async (categoryId) => {
    try {
      const response = await apiClient.get(`${API.RESOURCES.BY_CATEGORY}/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resources for category ${categoryId}:`, error);
      throw error;
    }
  },
  
  // Function to track resource clicks if you need analytics
  trackResourceClick: async (resourceId) => {
    try {
      const response = await apiClient.post(`${API.RESOURCES.TRACK_CLICK}`, { resourceId });
      return response.data;
    } catch (error) {
      console.error(`Error tracking resource click ${resourceId}:`, error);
      // Silent fail - don't throw error as this is just analytics
    }
  },
};

export default ResourcesService;
