// src/api/scenarioService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const streamScenario = async (industry, attackType, skillLevel, threatIntensity) => {
  try {
    const response = await apiClient.post(
      API.SCENARIO.STREAM_SCENARIO,
      {
        industry,
        attack_type: attackType,
        skill_level: skillLevel,
        threat_intensity: threatIntensity
      },
      {
        responseType: 'text'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error streaming scenario:', error);
    throw error;
  }
};

export const streamScenarioQuestions = async (scenarioText) => {
  try {
    const response = await apiClient.post(
      API.SCENARIO.STREAM_QUESTIONS,
      { scenario_text: scenarioText },
      {
        responseType: 'json'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error streaming scenario questions:', error);
    throw error;
  }
};
