// src/api/shopService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const getShopItems = async () => {
  try {
    const response = await apiClient.get(API.SHOP.ITEMS);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop items:', error);
    // Return an empty array as fallback to prevent undefined errors
    return [];
  }
};

export const purchaseItem = async (userId, itemId) => {
  try {
    const response = await apiClient.post(API.SHOP.PURCHASE(itemId), { userId });
    return response.data;
  } catch (error) {
    console.error('Error purchasing item:', error);
    throw error;
  }
};

export const equipItem = async (userId, itemId) => {
  try {
    const response = await apiClient.post(API.SHOP.EQUIP, { userId, itemId });
    return response.data;
  } catch (error) {
    console.error('Error equipping item:', error);
    throw error;
  }
};

export default {
  getShopItems,
  purchaseItem,
  equipItem
};
