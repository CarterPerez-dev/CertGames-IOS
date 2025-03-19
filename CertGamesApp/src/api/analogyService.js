// src/api/analogyService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const streamAnalogy = async (analogyType, concept1, concept2 = '', concept3 = '', category = 'real-world') => {
  try {
    const response = await apiClient.post(
      API.ANALOGY.STREAM,
      {
        analogy_type: analogyType,
        concept1,
        concept2,
        concept3,
        category
      },
      {
        responseType: 'text'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error streaming analogy:', error);
    throw error;
  }
};
