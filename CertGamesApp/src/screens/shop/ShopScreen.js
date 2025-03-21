// src/screens/shop/ShopScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchShopItems as reduxFetchShopItems } from '../../store/slices/shopSlice';
import { fetchUserData } from '../../store/slices/userSlice';
import * as shopService from '../../api/shopService';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// Import theme context
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

// Item type components
import AvatarItem from './components/AvatarItem';
import BoostItem from './components/BoostItem';

const { width } = Dimensions.get('window');

const ShopScreen = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  const { userId, coins, level, purchasedItems, currentAvatar } = useSelector((state) => state.user);
  const { items: reduxShopItems, status } = useSelector((state) => state.shop);
  
  const [shopItems, setShopItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [equipLoading, setEquipLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Track whether initial loading has been done
  const initialLoadDone = useRef(false);
  
  // Initial load - using useEffect to load data on component mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadShopData();
    }
  }, []);
  
  // Effect to apply sorting when shop items change
  useEffect(() => {
    if (shopItems && shopItems.length > 0) {
      filterItems(shopItems, activeCategory);
    }
  }, [shopItems]);
  
  // Watch for Redux shop items changes
  useEffect(() => {
    if (reduxShopItems && reduxShopItems.length > 0) {
      setShopItems(reduxShopItems);
      filterItems(reduxShopItems, activeCategory);
      setLoading(false);
    }
  }, [reduxShopItems, activeCategory]);
  
  // Function to load shop data
  const loadShopData = async () => {
    try {
      setLoading(true);
      // Dispatch Redux action to fetch shop items
      dispatch(reduxFetchShopItems());
    } catch (error) {
      console.error('Error loading shop data:', error);
      setLoading(false);
    }
  };
  
  // Filter and sort items by category, level requirement, and type
  const filterItems = (items, category) => {
    let filtered = [];
    
    if (category === 'all') {
      // First get all avatar items
      const avatarItems = items.filter(item => item.type === 'avatar')
        .sort((a, b) => {
          // Sort by level requirement (or price if levels are the same)
          if (a.unlockLevel === b.unlockLevel) {
            return a.cost - b.cost;
          }
          return a.unlockLevel - b.unlockLevel;
        });
      
      // Then get all XP boost items
      const boostItems = items.filter(item => item.type === 'xpBoost')
        .sort((a, b) => a.cost - b.cost);
      
      // Combine them (avatars first, then boosts)
      filtered = [...avatarItems, ...boostItems];
    } else if (category === 'avatar') {
      // Sort avatars by level requirement (or price if levels are the same)
      filtered = items.filter(item => item.type === category)
        .sort((a, b) => {
          if (a.unlockLevel === b.unlockLevel) {
            return a.cost - b.cost;
          }
          return a.unlockLevel - b.unlockLevel;
        });
    } else if (category === 'xpBoost') {
      // Sort XP boosts by price
      filtered = items.filter(item => item.type === category)
        .sort((a, b) => a.cost - b.cost);
    } else {
      // Any other category
      filtered = items.filter(item => item.type === category);
    }
    
    setFilteredItems(filtered);
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveCategory(category);
    filterItems(shopItems, category);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(reduxFetchShopItems()),
        dispatch(fetchUserData(userId))
      ]);
    } catch (error) {
      console.error('Error refreshing shop data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Show item details modal
  const showItemDetails = (item) => {
    setSelectedItem(item);
    setImageError(false);
    setModalVisible(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  // Handle image error in modal
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Handle item purchase
  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    // Check if user has enough coins
    if (coins < selectedItem.cost) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${selectedItem.cost - coins} more coins to purchase this item.`
      );
      return;
    }
    
    // Ask for confirmation
    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase ${selectedItem.title} for ${selectedItem.cost} coins?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              setPurchaseLoading(true);
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              await shopService.purchaseItem(userId, selectedItem._id);
              Alert.alert('Success', `You have purchased ${selectedItem.title}!`);
              
              // Refresh user data to update coins and purchased items
              await dispatch(fetchUserData(userId));
              
              // Ask if user wants to equip the item immediately
              if (selectedItem.type === 'avatar') {
                Alert.alert(
                  'Equip Item',
                  `Do you want to equip ${selectedItem.title} now?`,
                  [
                    {
                      text: 'No',
                      style: 'cancel'
                    },
                    {
                      text: 'Yes',
                      onPress: () => handleEquip()
                    }
                  ]
                );
              }
              
              // Close the modal
              setModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to purchase item. Please try again.');
              console.error('Purchase error:', error);
            } finally {
              setPurchaseLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Handle equipping an item
  const handleEquip = async () => {
    if (!selectedItem) return;
    
    try {
      setEquipLoading(true);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await shopService.equipItem(userId, selectedItem._id);
      Alert.alert('Success', `You have equipped ${selectedItem.title}!`);
      
      // Refresh user data to update equipped items
      await dispatch(fetchUserData(userId));
      
      // Close the modal
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to equip item. Please try again.');
      console.error('Equip error:', error);
    } finally {
      setEquipLoading(false);
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
  
  // Render shop item based on type
  const renderShopItem = ({ item }) => {
    const isPurchased = isItemPurchased(item._id);
    const isEquipped = isItemEquipped(item._id);
    const canPurchase = coins >= item.cost && !isPurchased;
    
    let ItemComponent;
    switch (item.type) {
      case 'avatar':
        ItemComponent = AvatarItem;
        break;
      case 'xpBoost':
        ItemComponent = BoostItem;
        break;
      default:
        ItemComponent = AvatarItem;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { backgroundColor: theme.colors.surface },
          isPurchased && { borderColor: theme.colors.success, borderWidth: 1 },
          isEquipped && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => showItemDetails(item)}
        disabled={loading}
        activeOpacity={0.7}
      >
        <ItemComponent 
          item={item} 
          isPurchased={isPurchased} 
          isEquipped={isEquipped} 
          theme={theme}
        />
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.itemFooter}>
            {!isPurchased ? (
              <>
                {item.unlockLevel > level ? (
                  <View style={styles.lockedContainer}>
                    <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.lockedText, { color: theme.colors.textMuted }]}>
                      Unlock at Level {item.unlockLevel}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.priceContainer}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.goldBadge} />
                    <Text style={[
                      styles.priceText,
                      { color: theme.colors.goldBadge },
                      !canPurchase && { color: theme.colors.error }
                    ]}>
                      {item.cost}
                    </Text>
                  </View>
                )}
              </>
            ) : isEquipped ? (
              <View style={styles.equippedContainer}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={[styles.equippedText, { color: theme.colors.success }]}>Equipped</Text>
              </View>
            ) : (
              <View style={styles.purchasedContainer}>
                <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                <Text style={[styles.purchasedText, { color: theme.colors.success }]}>Purchased</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="cart-outline" size={60} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No items found in this category
        </Text>
      </View>
    );
  };
  
  // Render item details modal
  const renderItemModal = () => {
    if (!selectedItem) return null;
    
    const isPurchased = isItemPurchased(selectedItem._id);
    const isEquipped = isItemEquipped(selectedItem._id);
    const canPurchase = coins >= selectedItem.cost && !isPurchased;
    const isLocked = selectedItem.unlockLevel > level;
    
    let itemImage = null;

    // Determine if it has a proper image URL
    if (selectedItem.imageUrl && selectedItem.type === 'avatar') {
      itemImage = (
        <Image
          source={{ uri: selectedItem.imageUrl }}
          style={styles.modalItemImage}
          onError={handleImageError}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedItem.title}
            </Text>
            
            <View style={styles.modalContent}>
              {selectedItem.type === 'avatar' && (
                <View style={[styles.modalAvatarContainer, { backgroundColor: theme.colors.background }]}>
                  {!imageError && itemImage ? (
                    <View style={styles.modalImageWrapper}>
                      {itemImage}
                    </View>
                  ) : (
                    <View style={[styles.modalAvatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.modalAvatarPlaceholderText}>
                        {selectedItem.title.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {selectedItem.type === 'xpBoost' && (
                <View style={styles.boostContainer}>
                  <LinearGradient
                    colors={theme.colors.primaryGradient}
                    style={styles.boostIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="flash" size={40} color={theme.colors.textInverse} />
                  </LinearGradient>
                  <Text style={[styles.boostValue, { color: theme.colors.text }]}>
                    {selectedItem.effectValue}x XP Boost
                  </Text>
                </View>
              )}
              
              <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
                {selectedItem.description || 'No description available.'}
              </Text>
              
              {isLocked ? (
                <LinearGradient 
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']} 
                  style={styles.modalLockedContainer}
                >
                  <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
                  <Text style={[styles.modalLockedText, { color: theme.colors.textSecondary }]}>
                    Unlocks at Level {selectedItem.unlockLevel}
                  </Text>
                </LinearGradient>
              ) : isPurchased ? (
                <View style={styles.modalActionContainer}>
                  {isEquipped ? (
                    <LinearGradient
                      colors={['rgba(46, 187, 119, 0.2)', 'rgba(46, 187, 119, 0.05)']}
                      style={styles.modalEquippedContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={[styles.modalEquippedText, { color: theme.colors.success }]}>
                        Currently Equipped
                      </Text>
                    </LinearGradient>
                  ) : (
                    <TouchableOpacity
                      style={[styles.equipButton, { backgroundColor: theme.colors.success }]}
                      onPress={handleEquip}
                      disabled={equipLoading}
                    >
                      {equipLoading ? (
                        <ActivityIndicator color={theme.colors.textInverse} size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />
                          <Text style={[styles.equipButtonText, { color: theme.colors.textInverse }]}>
                            Equip Now
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.modalActionContainer}>
                  <View style={styles.modalPriceContainer}>
                    <Ionicons name="cash-outline" size={18} color={theme.colors.goldBadge} />
                    <Text style={[
                      styles.modalPriceText,
                      { color: theme.colors.text },
                      !canPurchase && { color: theme.colors.error }
                    ]}>
                      {selectedItem.cost}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      { backgroundColor: theme.colors.primary },
                      !canPurchase && { backgroundColor: theme.colors.buttonSecondary, opacity: 0.7 }
                    ]}
                    onPress={handlePurchase}
                    disabled={!canPurchase || purchaseLoading}
                  >
                    {purchaseLoading ? (
                      <ActivityIndicator color={theme.colors.textInverse} size="small" />
                    ) : (
                      <>
                        <Ionicons name="cart" size={20} color={theme.colors.textInverse} />
                        <Text style={[styles.purchaseButtonText, { color: theme.colors.textInverse }]}>
                          {canPurchase ? 'Purchase' : 'Not Enough Coins'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <View style={styles.header}>
        <Text style={[globalStyles.title, styles.titleText]}>Shop</Text>
        <View style={[styles.walletContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <Ionicons name="wallet-outline" size={20} color={theme.colors.goldBadge} />
          <Text style={[styles.coinBalance, { color: theme.colors.text }]}>{coins}</Text>
        </View>
      </View>
      
      <View style={[styles.categoriesContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
        <ScrollableTabs
          tabs={[
            { id: 'all', label: 'All Items' },
            { id: 'avatar', label: 'Avatars' },
            { id: 'xpBoost', label: 'XP Boosts' }
          ]}
          activeTab={activeCategory}
          onTabChange={handleCategoryChange}
          theme={theme}
        />
      </View>
      
      <FlatList
        data={filteredItems}
        renderItem={renderShopItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={styles.columnWrapper}
      />
      
      {renderItemModal()}
      
      {loading && !refreshing && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

// ScrollableTabs component
const ScrollableTabs = ({ tabs, activeTab, onTabChange, theme }) => {
  return (
    <FlatList
      data={tabs}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabsContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: theme.colors.surface },
            activeTab === item.id && [
              styles.activeTabButton, 
              { backgroundColor: theme.colors.primary }
            ]
          ]}
          onPress={() => onTabChange(item.id)}
        >
          <Text style={[
            styles.tabButtonText,
            { color: theme.colors.textMuted },
            activeTab === item.id && [
              styles.activeTabButtonText,
              { color: theme.colors.textInverse }
            ]
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinBalance: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  
  // Categories tabs
  categoriesContainer: {
    paddingVertical: 12,
    marginBottom: 10,
  },
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTabButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    fontWeight: 'bold',
  },
  
  // Item grid
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for tab bar
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (width - 48) / 2, // Two columns with proper spacing
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  purchasedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchasedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  equippedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equippedText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 8,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalAvatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalImageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 70,
  },
  modalItemImage: {
    width: '90%',
    height: '90%',
    borderRadius: 70,
    resizeMode: 'contain',
  },
  modalAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarPlaceholderText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  boostContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  boostIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  boostValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  modalLockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  modalLockedText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  modalActionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalPriceText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  purchaseButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  modalEquippedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  modalEquippedText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  equipButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ShopScreen;
