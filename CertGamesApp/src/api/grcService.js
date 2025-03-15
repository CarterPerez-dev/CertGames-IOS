// src/api/grcService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const streamGRCQuestion = async (category = 'Random', difficulty = 'Easy') => {
  try {
    const response = await apiClient.post(
      API.GRC.STREAM_QUESTION,
      { category, difficulty },
      {
        responseType: 'json',
        onDownloadProgress: progressEvent => {
          const jsonChunks = progressEvent.currentTarget.response;
          // Process JSON chunks here
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error streaming GRC question:', error);
    throw error;
  }
};
