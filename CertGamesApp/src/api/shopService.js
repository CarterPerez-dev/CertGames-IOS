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
 * Equip an item (avatars and name colors only)
 * @param {string} userId User ID
 * @param {string} itemId Item ID to equip
 * @param {Object} options Additional options
 * @returns {Promise} Equip result
 */
export const equipItem = async (userId, itemId, options = {}) => {
  try {
    const response = await apiClient.post(API.SHOP.EQUIP, { 
      userId, 
      itemId,
      ...options 
    });
    return response.data;
  } catch (error) {
    console.error('Error equipping item:', error);
    throw error;
  }
};

/**
 * Activate an XP boost (separate from equipping an avatar)
 * Using the same endpoint as equipItem but with special parameters
 * that tell the backend this is an XP boost activation
 * @param {string} userId User ID
 * @param {string} boostId XP Boost ID to activate
 * @returns {Promise} Activation result
 */
export const activateXpBoost = async (userId, boostId) => {
  try {
    // Use the existing equipItem endpoint but with special parameters
    // to indicate this is an XP boost activation, not an avatar equip
    const response = await apiClient.post(API.SHOP.EQUIP, {
      userId,
      itemId: boostId,
      // These are the critical flags that tell the backend
      // to only update the xpBoost field, not the currentAvatar field
      xpBoostActivation: true,
      skipAvatarUpdate: true,
      updateXpBoostOnly: true
    });
    return response.data;
  } catch (error) {
    console.error('Error activating XP boost:', error);
    throw error;
  }
};

export default {
  getShopItems,
  fetchShopItems,
  purchaseItem,
  equipItem,
  activateXpBoost
};
