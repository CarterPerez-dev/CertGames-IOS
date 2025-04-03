// src/api/contactService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const submitContactForm = async (data) => {
  try {
    const response = await apiClient.post(`${API.CONTACT}/submit`, data);
    return response.data;
  } catch (error) {
    console.error('Contact form submission error:', error.response?.data || error.message);
    throw error;
  }
};
