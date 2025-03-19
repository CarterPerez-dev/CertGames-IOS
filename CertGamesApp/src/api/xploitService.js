// src/api/xploitService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const generatePayload = async (vulnerability, evasionTechnique, stream = true) => {
  try {
    const response = await apiClient.post(
      API.XPLOIT.GENERATE_PAYLOAD,
      {
        vulnerability,
        evasion_technique: evasionTechnique,
        stream
      },
      {
        responseType: stream ? 'text' : 'json'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating payload:', error);
    throw error;
  }
};
