// src/api/shopService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Fetch all available shop items
 * @returns {Promise} - Resolution of the API call with shop items
 */
export const fetchShopItems = async () => {
  try {
    const response = await apiClient.get(API.SHOP.ITEMS);
    return response.data;
  } catch (error) {
    console.error('Shop items fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch shop items');
  }
};

/**
 * Purchase an item from the shop
 * @param {string} userId - The user's ID
 * @param {string} itemId - The ID of the item to purchase
 * @returns {Promise} - Resolution of the API call
 */
export const purchaseItem = async (userId, itemId) => {
  try {
    const response = await apiClient.post(API.SHOP.PURCHASE(itemId), { userId });
    return response.data;
  } catch (error) {
    console.error('Purchase error:', error);
    throw new Error(error.response?.data?.message || 'Failed to purchase item');
  }
};

/**
 * Equip a purchased item
 * @param {string} userId - The user's ID
 * @param {string} itemId - The ID of the item to equip
 * @returns {Promise} - Resolution of the API call
 */
export const equipItem = async (userId, itemId) => {
  try {
    const response = await apiClient.post(API.SHOP.EQUIP, { userId, itemId });
    return response.data;
  } catch (error) {
    console.error('Equip item error:', error);
    throw new Error(error.response?.data?.message || 'Failed to equip item');
  }
};
