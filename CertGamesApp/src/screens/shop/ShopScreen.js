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
  Dimensions,
  StatusBar,
  Animated,
  ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchShopItems as reduxFetchShopItems } from '../../store/slices/shopSlice';
import { fetchUserData } from '../../store/slices/userSlice';
import * as shopService from '../../api/shopService';
import * as Haptics from 'expo-haptics';

// Import theme context
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

// Item type components
import AvatarItem from './components/AvatarItem';
import BoostItem from './components/BoostItem';


const { width, height } = Dimensions.get('window');

const ShopScreen = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  const { userId, coins, level, purchasedItems, currentAvatar, nameColor } = useSelector((state) => state.user);
  const { items: reduxShopItems, status } = useSelector((state) => state.shop);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState([...Array(20)].map(() => new Animated.Value(0)));
  const [headerTextOpacity] = useState(new Animated.Value(1));
  
  // State
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
      // No longer need separate purchase options since users can always buy with coins
  const [statusMessage, setStatusMessage] = useState(null);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusType, setStatusType] = useState(''); // 'success', 'error', etc.
  
  // Track whether initial loading has been done
  const initialLoadDone = useRef(false);
  
  // Animations on mount
  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
    
    // Staggered card animations
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 100 + (i * 70),
        useNativeDriver: true
      }).start();
    });
  }, []);
  
  // Effect to clear status message after a delay
  useEffect(() => {
    if (statusMessage && showStatusMessage) {
      const timer = setTimeout(() => {
        setShowStatusMessage(false);
        setTimeout(() => {
          setStatusMessage(null);
          setStatusType('');
        }, 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage, showStatusMessage]);
  
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
  }, [shopItems, activeCategory]);
  
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
      showStatusToast('Failed to load shop items', 'error');
    }
  };
  
  // Filter and sort items by category
  const filterItems = (items, category) => {
    let filtered = [];
    
    if (category === 'all') {
      // Show all items, sorted by type and then level requirement
      filtered = [...items].sort((a, b) => {
        // First sort by type
        if (a.type !== b.type) {
          const typeOrder = { 'avatar': 1, 'xpBoost': 2, 'nameColor': 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        
        // Then sort by level requirement
        if (a.unlockLevel !== b.unlockLevel) {
          return a.unlockLevel - b.unlockLevel;
        }
        
        // Finally sort by cost
        return a.cost - b.cost;
      });
    } else {
      // Filter by category and sort by level and cost
      filtered = items
        .filter(item => item.type === category)
        .sort((a, b) => {
          if (a.unlockLevel !== b.unlockLevel) {
            return a.unlockLevel - b.unlockLevel;
          }
          return a.cost - b.cost;
        });
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
      showStatusToast('Failed to refresh shop data', 'error');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Display status toast
  const showStatusToast = (message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setShowStatusMessage(true);
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
  
  // Item unlock status checks
  const isItemPurchased = (itemId) => {
    return purchasedItems && purchasedItems.includes(itemId);
  };
  
  const isItemEquipped = (itemId, itemType) => {
    if (itemType === 'avatar') {
      return currentAvatar === itemId;
    }
    return false;
  };
  
  const canAffordItem = (item) => {
    return coins >= item.cost;
  };
  
  const hasRequiredLevel = (item) => {
    return level >= item.unlockLevel;
  };
  
  // Can purchase item either by meeting level requirement OR by having enough coins
  const canPurchaseWithLevel = (item) => {
    return hasRequiredLevel(item) && canAffordItem(item) && !isItemPurchased(item._id);
  };
  
  // Can purchase with just coins regardless of level
  const canPurchaseWithCoins = (item) => {
    return canAffordItem(item) && !isItemPurchased(item._id);
  };
  
  // No longer need to toggle purchase options
  
  // Handle item purchase
  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    // Check if user has enough coins - this is always required
    if (!canAffordItem(selectedItem)) {
      showStatusToast(`You need ${selectedItem.cost - coins} more coins`, 'error');
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
              
              const response = await shopService.purchaseItem(userId, selectedItem._id);
              
              // Update user data in Redux to reflect new coin balance and purchased items
              await dispatch(fetchUserData(userId));
              
              showStatusToast(`Successfully purchased ${selectedItem.title}!`, 'success');
              
              // Ask if user wants to equip the item immediately if it's an avatar or name color
              if (selectedItem.type === 'avatar' || selectedItem.type === 'nameColor') {
                setTimeout(() => {
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
                }, 500);
              }
              
              // Close the modal
              setModalVisible(false);
            } catch (error) {
              console.error('Purchase error:', error);
              showStatusToast('Failed to purchase item. Please try again.', 'error');
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
      
      // Update user data in Redux
      await dispatch(fetchUserData(userId));
      
      showStatusToast(`Successfully equipped ${selectedItem.title}!`, 'success');
      
      // Close the modal
      setModalVisible(false);
    } catch (error) {
      console.error('Equip error:', error);
      showStatusToast('Failed to equip item. Please try again.', 'error');
    } finally {
      setEquipLoading(false);
    }
  };
  
  // Render shop item based on type
  const renderShopItem = ({ item, index }) => {
    const isPurchased = isItemPurchased(item._id);
    const isEquipped = isItemEquipped(item._id, item.type);
    const canAfford = canAffordItem(item);
    const isUnlocked = hasRequiredLevel(item);
    
    // Calculate animation index
    const animIndex = Math.min(index, cardAnims.length - 1);
    
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
      <Animated.View
        style={{
          opacity: cardAnims[animIndex],
          transform: [{
            translateY: cardAnims[animIndex].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })
          }]
        }}
      >
        <TouchableOpacity
          style={[
            styles.itemCard,
            { 
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: isPurchased ? 
                (isEquipped ? theme.colors.primary : theme.colors.success) + '60' : 
                theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
            isEquipped && { 
              borderColor: theme.colors.primary,
              borderWidth: 2
            }
          ]}
          onPress={() => showItemDetails(item)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <ItemComponent 
            item={item} 
            isPurchased={isPurchased} 
            isEquipped={isEquipped} 
          />
          
          <View style={[styles.itemInfo, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.itemTitle, { 
              color: theme.colors.text,
              fontFamily: 'ShareTechMono'
            }]} numberOfLines={1}>
              {item.title}
            </Text>
            
            <View style={styles.itemFooter}>
              {!isPurchased ? (
                <View style={styles.purchaseInfo}>
                  {/* Level requirement */}
                  <View style={[styles.requirementBadge, { 
                    backgroundColor: isUnlocked ? 
                      `${theme.colors.success}20` : 
                      `${theme.colors.textMuted}20`,
                    borderColor: isUnlocked ?
                      theme.colors.success + '40' :
                      theme.colors.border
                  }]}>
                    <Ionicons 
                      name="shield" 
                      size={12} 
                      color={isUnlocked ? 
                        theme.colors.success : 
                        theme.colors.textMuted
                      } 
                    />
                    <Text style={[styles.requirementText, { 
                      color: isUnlocked ? 
                        theme.colors.success : 
                        theme.colors.textMuted,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      LVL {item.unlockLevel}
                    </Text>
                  </View>
                  
                  {/* Price tag */}
                  <View style={[styles.priceBadge, {
                    backgroundColor: canAfford ? 
                      `${theme.colors.goldBadge}20` : 
                      `${theme.colors.error}20`,
                    borderColor: canAfford ?
                      theme.colors.goldBadge + '40' :
                      theme.colors.error + '40'
                  }]}>
                    <Ionicons 
                      name="cash" 
                      size={12} 
                      color={canAfford ? 
                        theme.colors.goldBadge : 
                        theme.colors.error
                      } 
                    />
                    <Text style={[styles.priceText, { 
                      color: canAfford ? 
                        theme.colors.goldBadge : 
                        theme.colors.error,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      {item.cost}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  {isEquipped ? (
                    <View style={[styles.equipBadge, { 
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: theme.colors.primary + '40'
                    }]}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
                      <Text style={[styles.equipText, { 
                        color: theme.colors.primary,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        EQUIPPED
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.ownedBadge, { 
                      backgroundColor: `${theme.colors.success}20`,
                      borderColor: theme.colors.success + '40'
                    }]}>
                      <Ionicons name="checkmark" size={12} color={theme.colors.success} />
                      <Text style={[styles.ownedText, { 
                        color: theme.colors.success,
                        fontFamily: 'ShareTechMono'
                      }]}>
                        OWNED
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }]}>
        <Ionicons name="cart-outline" size={60} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { 
          color: theme.colors.textSecondary,
          fontFamily: 'ShareTechMono'
        }]}>
          NO ITEMS FOUND IN THIS CATEGORY
        </Text>
      </View>
    );
  };
  
  // Render item details modal
  const renderItemModal = () => {
    if (!selectedItem) return null;
    
    const isPurchased = isItemPurchased(selectedItem._id);
    const isEquipped = isItemEquipped(selectedItem._id, selectedItem.type);
    const canAfford = canAffordItem(selectedItem);
    const hasLevel = hasRequiredLevel(selectedItem);
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} 
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContainer, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <LinearGradient
              colors={theme.colors.primaryGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.modalHeader}
            >
              <Ionicons 
                name={selectedItem.type === 'avatar' ? 'person-circle' : 
                      selectedItem.type === 'xpBoost' ? 'flash' : 'color-palette'} 
                size={24} 
                color={theme.colors.buttonText} 
              />
              <Text style={[styles.modalTitle, { 
                color: theme.colors.buttonText,
                fontFamily: 'Orbitron-Bold'
              }]}>
                {selectedItem.title.toUpperCase()}
              </Text>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              {/* Item Preview */}
              <View style={[styles.previewContainer, {
                backgroundColor: theme.colors.surfaceHighlight,
                borderColor: theme.colors.border,
              }]}>
                {selectedItem.type === 'avatar' && (
                  !imageError && selectedItem.imageUrl ? (
                    <Image
                      source={{ uri: selectedItem.imageUrl }}
                      style={styles.previewImage}
                      onError={handleImageError}
                    />
                  ) : (
                    <View style={[styles.previewFallback, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.fallbackText, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                        {selectedItem.title.charAt(0)}
                      </Text>
                    </View>
                  )
                )}
                
                {selectedItem.type === 'xpBoost' && (
                  <View style={styles.boostPreview}>
                    <LinearGradient
                      colors={theme.colors.primaryGradient}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.boostIcon}
                    >
                      <Ionicons name="flash" size={40} color={theme.colors.buttonText} />
                    </LinearGradient>
                    <Text style={[styles.boostValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                      {selectedItem.effectValue}x XP
                    </Text>
                  </View>
                )}
                

              </View>
              
              {/* Item Description */}
              <Text style={[styles.itemDescription, { 
                color: theme.colors.textSecondary,
                fontFamily: 'ShareTechMono'
              }]}>
                {selectedItem.description || 'No description available.'}
              </Text>
              
              {/* Item Details */}
              <View style={styles.itemDetailsGrid}>
                {/* Cost */}
                <View style={[styles.detailItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderColor: theme.colors.border
                }]}>
                  <Ionicons name="cash" size={20} color={theme.colors.goldBadge} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      COST
                    </Text>
                    <Text style={[styles.detailValue, { 
                      color: canAfford ? theme.colors.goldBadge : theme.colors.error,
                      fontFamily: 'Orbitron'
                    }]}>
                      {selectedItem.cost} COINS
                    </Text>
                  </View>
                </View>
                
                {/* Level Requirement */}
                <View style={[styles.detailItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderColor: theme.colors.border
                }]}>
                  <Ionicons 
                    name="shield" 
                    size={20} 
                    color={hasLevel ? theme.colors.success : theme.colors.error} 
                  />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      REQUIRED LEVEL
                    </Text>
                    <Text style={[styles.detailValue, { 
                      color: hasLevel ? theme.colors.success : theme.colors.error,
                      fontFamily: 'Orbitron'
                    }]}>
                      LEVEL {selectedItem.unlockLevel}
                      {hasLevel ? ' (UNLOCKED)' : ' (LOCKED)'}
                    </Text>
                  </View>
                </View>
                
                {/* Status */}
                <View style={[styles.detailItem, { 
                  backgroundColor: theme.colors.surfaceHighlight,
                  borderColor: theme.colors.border
                }]}>
                  <Ionicons 
                    name={isPurchased ? 
                      (isEquipped ? "checkmark-circle" : "checkmark") : 
                      "cart"
                    } 
                    size={20} 
                    color={isPurchased ? 
                      (isEquipped ? theme.colors.primary : theme.colors.success) : 
                      theme.colors.text
                    } 
                  />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { 
                      color: theme.colors.textSecondary,
                      fontFamily: 'ShareTechMono'
                    }]}>
                      STATUS
                    </Text>
                    <Text style={[styles.detailValue, { 
                      color: isPurchased ? 
                        (isEquipped ? theme.colors.primary : theme.colors.success) : 
                        theme.colors.text,
                      fontFamily: 'Orbitron'
                    }]}>
                      {isPurchased ? 
                        (isEquipped ? 'EQUIPPED' : 'OWNED') : 
                        'NOT PURCHASED'
                      }
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {!isPurchased ? (
                  <>
                    {/* There's no need for a toggle anymore since users can always purchase with coins */}
                    
                    {/* Purchase Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { 
                          backgroundColor: canAfford ? 
                            theme.colors.primary : 
                            theme.colors.surfaceHighlight,
                          borderColor: canAfford ? 
                            theme.colors.primary : 
                            theme.colors.border
                        }
                      ]}
                      onPress={handlePurchase}
                      disabled={!canAfford || purchaseLoading}
                    >
                      {purchaseLoading ? (
                        <ActivityIndicator color={theme.colors.buttonText} size="small" />
                      ) : (
                        <>
                          <Ionicons 
                            name="cart" 
                            size={18} 
                            color={canAfford ? 
                              theme.colors.buttonText : 
                              theme.colors.textMuted
                            } 
                          />
                          <Text style={[styles.actionButtonText, { 
                            color: canAfford ? 
                              theme.colors.buttonText : 
                              theme.colors.textMuted,
                            fontFamily: 'Orbitron'
                          }]}>
                            {canAfford ? 
                              `PURCHASE FOR ${selectedItem.cost} COINS` : 
                              `NEED ${selectedItem.cost - coins} MORE COINS`
                            }
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : !isEquipped ? (
                  // Equip Button for owned items
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { 
                        backgroundColor: theme.colors.success,
                        borderColor: theme.colors.success
                      }
                    ]}
                    onPress={handleEquip}
                    disabled={equipLoading}
                  >
                    {equipLoading ? (
                      <ActivityIndicator color={theme.colors.buttonText} size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={theme.colors.buttonText} />
                        <Text style={[styles.actionButtonText, { 
                          color: theme.colors.buttonText,
                          fontFamily: 'Orbitron'
                        }]}>
                          EQUIP {selectedItem.type.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  // Already Equipped Message
                  <View style={[styles.equippedMessage, { 
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: theme.colors.primary
                  }]}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    <Text style={[styles.equippedText, { 
                      color: theme.colors.primary,
                      fontFamily: 'Orbitron'
                    }]}>
                      CURRENTLY EQUIPPED
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Handle scroll for animations
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );
  
  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <StatusBar barStyle="light-content" />
      
      {/* Main Content */}
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[theme.colors.primary + '30', 'transparent']}
            start={{x: 0.5, y: 0}}
            end={{x: 0.5, y: 1}}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                ITEM <Text style={{ color: theme.colors.primary }}>SHOP</Text>
              </Text>
              <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                CUSTOMIZE YOUR EXPERIENCE
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* User Stats & Wallet */}
        <Animated.View 
          style={[
            styles.userStatsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={[styles.walletCard, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border + '60',
            shadowColor: theme.colors.shadow
          }]}>
            <View style={styles.walletGrid}>
              <View style={[styles.walletItem, { borderRightColor: theme.colors.border + '40' }]}>
                <Ionicons name="cash" size={24} color={theme.colors.goldBadge} />
                <View style={styles.walletItemContent}>
                  <Text style={[styles.walletAmount, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    {coins.toLocaleString()}
                  </Text>
                  <Text style={[styles.walletLabel, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    COINS
                  </Text>
                </View>
              </View>
              
              <View style={styles.walletItem}>
                <Ionicons name="shield" size={24} color={theme.colors.primary} />
                <View style={styles.walletItemContent}>
                  <Text style={[styles.walletAmount, { 
                    color: theme.colors.text,
                    fontFamily: 'Orbitron-Bold'
                  }]}>
                    {level}
                  </Text>
                  <Text style={[styles.walletLabel, { 
                    color: theme.colors.textSecondary,
                    fontFamily: 'ShareTechMono'
                  }]}>
                    LEVEL
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Category Filters */}
        <Animated.View 
          style={[
            styles.filterContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                activeCategory === 'all' && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              ]}
              onPress={() => handleCategoryChange('all')}
            >
              <Ionicons 
                name="grid" 
                size={16} 
                color={activeCategory === 'all' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted
                } 
              />
              <Text style={[styles.filterText, { 
                color: activeCategory === 'all' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted,
                fontFamily: 'ShareTechMono'
              }]}>
                ALL
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                activeCategory === 'avatar' && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              ]}
              onPress={() => handleCategoryChange('avatar')}
            >
              <Ionicons 
                name="person-circle" 
                size={16} 
                color={activeCategory === 'avatar' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted
                } 
              />
              <Text style={[styles.filterText, { 
                color: activeCategory === 'avatar' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted,
                fontFamily: 'ShareTechMono'
              }]}>
                AVATARS
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                activeCategory === 'xpBoost' && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              ]}
              onPress={() => handleCategoryChange('xpBoost')}
            >
              <Ionicons 
                name="flash" 
                size={16} 
                color={activeCategory === 'xpBoost' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted
                } 
              />
              <Text style={[styles.filterText, { 
                color: activeCategory === 'xpBoost' ? 
                  theme.colors.buttonText : 
                  theme.colors.textMuted,
                fontFamily: 'ShareTechMono'
              }]}>
                XP BOOSTS
              </Text>
            </TouchableOpacity>
            

          </ScrollView>
        </Animated.View>
        
        {/* Items Grid */}
        <FlatList
          data={filteredItems}
          renderItem={renderShopItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        
        {/* Status Toast */}
        {showStatusMessage && statusMessage && (
          <View style={[styles.statusToast, { 
            backgroundColor: statusType === 'success' ? 
              `${theme.colors.success}E0` : 
              statusType === 'error' ? 
                `${theme.colors.error}E0` : 
                `${theme.colors.primary}E0`
          }]}>
            <Ionicons 
              name={statusType === 'success' ? 
                "checkmark-circle" : 
                statusType === 'error' ? 
                  "alert-circle" : 
                  "information-circle"
              } 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={[styles.statusText, { color: "#FFFFFF", fontFamily: 'ShareTechMono' }]}>
              {statusMessage}
            </Text>
          </View>
        )}
        
        {/* Item Details Modal */}
        {renderItemModal()}
        
        {/* Loading Overlay */}
        {loading && !refreshing && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.overlay }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { 
              color: theme.colors.text,
              fontFamily: 'ShareTechMono'
            }]}>
              LOADING SHOP ITEMS...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerGradient: {
    paddingVertical: 15,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  // User Stats & Wallet
  userStatsContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  walletCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  walletGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRightWidth: 1,
  },
  walletItemContent: {
    marginLeft: 12,
  },
  walletAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletLabel: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  
  // Category Filters
  filterContainer: {
    marginBottom: 15,
  },
  filterScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  
  // Item Grid
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (width - 35) / 2, // Two columns with spacing
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    padding: 10,
    borderTopWidth: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseInfo: {
    flexDirection: 'row',
    gap: 6,
  },
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  requirementText: {
    fontSize: 10,
    marginLeft: 3,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  priceText: {
    fontSize: 10,
    marginLeft: 3,
  },
  statusBadge: {
    flexDirection: 'row',
  },
  equipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  equipText: {
    fontSize: 10,
    marginLeft: 3,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  ownedText: {
    fontSize: 10,
    marginLeft: 3,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    letterSpacing: 0.5,
  },
  
  // Status Toast
  statusToast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  
  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Item Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  previewContainer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  previewFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  boostPreview: {
    alignItems: 'center',
  },
  boostIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  boostValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  colorPreview: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 140,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemDetailsGrid: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  detailContent: {
    marginLeft: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    gap: 10,
  },
  purchaseToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 5,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    borderWidth: 1,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  equippedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    borderWidth: 1,
    gap: 10,
  },
  equippedText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ShopScreen;
