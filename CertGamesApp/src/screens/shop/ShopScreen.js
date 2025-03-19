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
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchShopItems as reduxFetchShopItems } from '../../store/slices/shopSlice';
import { fetchUserData } from '../../store/slices/userSlice';
import * as shopService from '../../api/shopService';

// Item type components
import AvatarItem from './components/AvatarItem';
import BoostItem from './components/BoostItem';
import ColorItem from './components/ColorItem';

const ShopScreen = () => {
  const dispatch = useDispatch();
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
  
  // Track whether initial loading has been done
  const initialLoadDone = useRef(false);
  
  // Initial load - using useEffect instead of useCallback to avoid infinite loop
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadShopData();
    }
  }, []);
  
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
    setModalVisible(true);
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
              await shopService.purchaseItem(userId, selectedItem._id);
              Alert.alert('Success', `You have purchased ${selectedItem.title}!`);
              
              // Refresh user data to update coins and purchased items
              await dispatch(fetchUserData(userId));
              
              // Ask if user wants to equip the item immediately
              if (selectedItem.type === 'avatar' || selectedItem.type === 'nameColor') {
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
      case 'nameColor':
        ItemComponent = ColorItem;
        break;
      default:
        ItemComponent = AvatarItem;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          isPurchased && styles.purchasedCard,
          isEquipped && styles.equippedCard
        ]}
        onPress={() => showItemDetails(item)}
        disabled={loading}
      >
        <ItemComponent item={item} isPurchased={isPurchased} isEquipped={isEquipped} />
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          
          <View style={styles.itemFooter}>
            {!isPurchased ? (
              <>
                {item.unlockLevel > level ? (
                  <View style={styles.lockedContainer}>
                    <Ionicons name="lock-closed" size={16} color="#AAAAAA" />
                    <Text style={styles.lockedText}>Unlock at Level {item.unlockLevel}</Text>
                  </View>
                ) : (
                  <View style={styles.priceContainer}>
                    <Ionicons name="cash-outline" size={16} color="#FFD700" />
                    <Text style={[
                      styles.priceText,
                      !canPurchase && styles.insufficientText
                    ]}>
                      {item.cost}
                    </Text>
                  </View>
                )}
              </>
            ) : isEquipped ? (
              <View style={styles.equippedContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#2ebb77" />
                <Text style={styles.equippedText}>Equipped</Text>
              </View>
            ) : (
              <View style={styles.purchasedContainer}>
                <Ionicons name="checkmark" size={16} color="#2ebb77" />
                <Text style={styles.purchasedText}>Purchased</Text>
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
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={60} color="#AAAAAA" />
        <Text style={styles.emptyText}>
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
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{selectedItem.title}</Text>
            
            <View style={styles.modalContent}>
              {selectedItem.type === 'avatar' && (
                <View style={styles.modalAvatarContainer}>
                  {/* Use placeholders for avatar images */}
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarPlaceholderText}>
                      {selectedItem.title.charAt(0)}
                    </Text>
                  </View>
                </View>
              )}
              
              {selectedItem.type === 'xpBoost' && (
                <View style={styles.boostContainer}>
                  <LinearGradient
                    colors={['#6543CC', '#FF4C8B']}
                    style={styles.boostIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="flash" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.boostValue}>
                    {selectedItem.effectValue}x XP Boost
                  </Text>
                </View>
              )}
              
              {selectedItem.type === 'nameColor' && (
                <View style={styles.colorContainer}>
                  <View style={[
                    styles.colorSample,
                    { backgroundColor: selectedItem.effectValue }
                  ]} />
                  <Text style={styles.colorName}>
                    {selectedItem.title}
                  </Text>
                </View>
              )}
              
              <Text style={styles.modalDescription}>
                {selectedItem.description || 'No description available.'}
              </Text>
              
              {isLocked ? (
                <View style={styles.modalLockedContainer}>
                  <Ionicons name="lock-closed" size={20} color="#AAAAAA" />
                  <Text style={styles.modalLockedText}>
                    Unlocks at Level {selectedItem.unlockLevel}
                  </Text>
                </View>
              ) : isPurchased ? (
                <View style={styles.modalActionContainer}>
                  {isEquipped ? (
                    <View style={styles.modalEquippedContainer}>
                      <Ionicons name="checkmark-circle" size={20} color="#2ebb77" />
                      <Text style={styles.modalEquippedText}>
                        Currently Equipped
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.equipButton}
                      onPress={handleEquip}
                      disabled={equipLoading}
                    >
                      {equipLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                          <Text style={styles.equipButtonText}>Equip Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.modalActionContainer}>
                  <View style={styles.modalPriceContainer}>
                    <Ionicons name="cash-outline" size={18} color="#FFD700" />
                    <Text style={[
                      styles.modalPriceText,
                      !canPurchase && styles.modalInsufficientText
                    ]}>
                      {selectedItem.cost}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      !canPurchase && styles.disabledButton
                    ]}
                    onPress={handlePurchase}
                    disabled={!canPurchase || purchaseLoading}
                  >
                    {purchaseLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="cart" size={20} color="#FFFFFF" />
                        <Text style={styles.purchaseButtonText}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.walletContainer}>
          <Ionicons name="wallet-outline" size={20} color="#FFD700" />
          <Text style={styles.coinBalance}>{coins}</Text>
        </View>
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollableTabs
          tabs={[
            { id: 'all', label: 'All Items' },
            { id: 'avatar', label: 'Avatars' },
            { id: 'xpBoost', label: 'XP Boosts' },
            { id: 'nameColor', label: 'Name Colors' }
          ]}
          activeTab={activeCategory}
          onTabChange={handleCategoryChange}
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
            colors={['#6543CC']}
            tintColor="#6543CC"
          />
        }
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={styles.columnWrapper}
      />
      
      {renderItemModal()}
      
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6543CC" />
        </View>
      )}
    </SafeAreaView>
  );
};

// ScrollableTabs component
const ScrollableTabs = ({ tabs, activeTab, onTabChange }) => {
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
            activeTab === item.id && styles.activeTabButton
          ]}
          onPress={() => onTabChange(item.id)}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === item.id && styles.activeTabButtonText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinBalance: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  categoriesContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#2A2A2A',
  },
  activeTabButton: {
    backgroundColor: '#6543CC',
  },
  tabButtonText: {
    color: '#AAAAAA',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  purchasedCard: {
    borderWidth: 1,
    borderColor: '#2ebb77',
  },
  equippedCard: {
    borderWidth: 1,
    borderColor: '#6543CC',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#2A2A2A',
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
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
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insufficientText: {
    color: '#FF4C8B',
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginLeft: 4,
  },
  purchasedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchasedText: {
    color: '#2ebb77',
    fontSize: 12,
    marginLeft: 4,
  },
  equippedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equippedText: {
    color: '#2ebb77',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalAvatarContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  modalAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalAvatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  boostContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  boostIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  colorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  colorSample: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(170, 170, 170, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalLockedText: {
    color: '#AAAAAA',
    marginLeft: 8,
  },
  modalActionContainer: {
    width: '100%',
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  modalInsufficientText: {
    color: '#FF4C8B',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6543CC',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#4F4F4F',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalEquippedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2ebb77',
  },
  modalEquippedText: {
    color: '#2ebb77',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ebb77',
    paddingVertical: 12,
    borderRadius: 8,
  },
  equipButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ShopScreen;
