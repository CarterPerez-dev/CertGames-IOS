// src/hooks/useShop.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import { fetchShopItems, purchaseItem, equipItem } from '../api/shopService';
import { fetchUserData } from '../store/slices/userSlice';
import { ERROR_MESSAGES } from '../constants/shopConstants';

/**
 * Custom hook for shop-related functionality
 * @returns {Object} Shop methods and state
 */
const useShop = () => {
  const dispatch = useDispatch();
  const { 
    userId = null, 
    coins = 0, 
    level = 1, 
    purchasedItems = [], 
    currentAvatar = null, 
    nameColor = null 
  } = useSelector((state) => state.user || {});
  
  const [shopItems, setShopItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState(null);
  
  // Function to load shop items
  const loadShopItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await fetchShopItems();
      setShopItems(items);
      filterItems(items, activeCategory);
      setError(null);
    } catch (err) {
      console.error('Shop items fetch error:', err);
      setError(ERROR_MESSAGES.FETCH_FAILED);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);
  
  // Initial load
  useEffect(() => {
    loadShopItems();
  }, [loadShopItems]);
  
  // Filter items by category
  const filterItems = (items, category) => {
    if (category === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.type === category));
    }
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    filterItems(shopItems, category);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadShopItems(),
      dispatch(fetchUserData(userId))
    ]);
    setRefreshing(false);
  };
  
  // Check if item is purchasable
  const canPurchaseItem = (item) => {
    if (!item) return false;
    
    // Check if item is already purchased
    if (isItemPurchased(item._id)) {
      return false;
    }
    
    // Check if user has enough coins
    if (coins < item.cost) {
      return false;
    }
    
    // Check if user has required level
    if (level < item.unlockLevel) {
      return false;
    }
    
    return true;
  };
  
  // Handle purchase with confirmation
  const handlePurchase = async (item) => {
    if (!item) return;
    
    // Check if user can purchase
    if (!canPurchaseItem(item)) {
      if (isItemPurchased(item._id)) {
        Alert.alert('Already Purchased', 'You already own this item');
        return;
      }
      
      if (coins < item.cost) {
        Alert.alert('Insufficient Coins', `You need ${item.cost - coins} more coins to purchase this item`);
        return;
      }
      
      if (level < item.unlockLevel) {
        Alert.alert('Level Required', `You need to reach level ${item.unlockLevel} to purchase this item`);
        return;
      }
      
      return;
    }
    
    // Ask for confirmation
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Confirm Purchase',
        `Are you sure you want to purchase ${item.title} for ${item.cost} coins?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Purchase',
            onPress: async () => {
              try {
                setLoading(true);
                await purchaseItem(userId, item._id);
                await dispatch(fetchUserData(userId));
                
                Alert.alert('Success', `You have purchased ${item.title}!`);
                resolve(true);
              } catch (error) {
                console.error('Purchase error:', error);
                Alert.alert('Error', ERROR_MESSAGES.PURCHASE_FAILED);
                resolve(false);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    });
  };
  
  // Handle equip with confirmation
  const handleEquip = async (item) => {
    if (!item) return;
    
    // Check if item is already equipped
    if (isItemEquipped(item._id)) {
      Alert.alert('Already Equipped', 'This item is already equipped');
      return false;
    }
    
    // Check if item is purchased
    if (!isItemPurchased(item._id)) {
      Alert.alert('Not Purchased', 'You need to purchase this item first');
      return false;
    }
    
    try {
      setLoading(true);
      await equipItem(userId, item._id);
      await dispatch(fetchUserData(userId));
      
      Alert.alert('Success', `You have equipped ${item.title}!`);
      return true;
    } catch (error) {
      console.error('Equip error:', error);
      Alert.alert('Error', ERROR_MESSAGES.EQUIP_FAILED);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Check if item is already purchased
  const isItemPurchased = (itemId) => {
    return purchasedItems && purchasedItems.includes(itemId);
  };
  
  // Check if item is already equipped
  const isItemEquipped = (itemId) => {
    return currentAvatar === itemId;
  };
  
  return {
    // State with fallbacks
    shopItems: shopItems || [],
    filteredItems: filteredItems || [],
    loading: loading || false,
    refreshing: refreshing || false,
    activeCategory: activeCategory || 'all',
    error: error || null,
    
    // Methods with fallbacks
    loadShopItems: loadShopItems || (() => {}),
    handleCategoryChange: handleCategoryChange || (() => {}),
    handleRefresh: handleRefresh || (() => {}),
    canPurchaseItem: canPurchaseItem || (() => false),
    handlePurchase: handlePurchase || (() => {}),
    handleEquip: handleEquip || (() => {}),
    isItemPurchased: isItemPurchased || (() => false),
    isItemEquipped: isItemEquipped || (() => false)
  };
};

export default useShop;
