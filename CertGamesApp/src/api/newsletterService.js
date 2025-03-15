// src/api/newsletterService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const subscribeToNewsletter = async (email) => {
  try {
    const response = await apiClient.post(API.NEWSLETTER.SUBSCRIBE, { email });
    return response.data;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

export const unsubscribeFromNewsletter = async (email) => {
  try {
    const response = await apiClient.post(API.NEWSLETTER.UNSUBSCRIBE, { email });
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
};

export const unsubscribeByToken = async (token) => {
  try {
    const response = await apiClient.get(API.NEWSLETTER.UNSUBSCRIBE_BY_TOKEN(token));
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing by token:', error);
    throw error;
  }
};
