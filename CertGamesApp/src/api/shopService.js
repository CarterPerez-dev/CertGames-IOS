// src/api/shopService.js
import apiClient from './apiClient';
import { API, BASE_URL } from './apiConfig';

// Helper to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a complete URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Fix relative URLs
  if (!url.startsWith('/') && !url.startsWith('./')) {
    url = '/' + url;
  }
  
  // Extract the domain without the "/api" path
  const apiIndex = BASE_URL.indexOf('/api');
  const domain = apiIndex !== -1 ? 
    BASE_URL.substring(0, apiIndex) : 
    BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
    
  url = url.replace(/^\/+/, '/'); // Ensure only one leading slash
  return domain + url;
};

/**
 * Fetch all shop items
 * @returns {Promise} Shop items
 */
export const fetchShopItems = async () => {
  try {
    const response = await apiClient.get(API.SHOP.ITEMS);
    
    // Process image URLs to ensure they're properly formatted
    const items = response.data.map(item => {
      if (item.imageUrl) {
        item.imageUrl = formatImageUrl(item.imageUrl);
      }
      return item;
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching shop items:', error);
    // Return an empty array as fallback to prevent undefined errors
    return [];
  }
};

export const getShopItems = fetchShopItems; // Alias for backward compatibility

/**
 * Purchase an item
 * @param {string} userId User ID
 * @param {string} itemId Item ID to purchase
 * @returns {Promise} Purchase result
 */
export const purchaseItem = async (userId, itemId) => {
  try {
    const response = await apiClient.post(API.SHOP.PURCHASE(itemId), { userId });
    return response.data;
  } catch (error) {
    console.error('Error purchasing item:', error);
    throw error;
  }
};

/**
 * Equip an item
 * @param {string} userId User ID
 * @param {string} itemId Item ID to equip
 * @returns {Promise} Equip result
 */
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
  fetchShopItems,
  purchaseItem,
  equipItem
};
