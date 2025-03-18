// src/constants/shopConstants.js

// Shop item types
export const ITEM_TYPES = {
  AVATAR: 'avatar',
  XP_BOOST: 'xpBoost',
  NAME_COLOR: 'nameColor',
};

// Shop categories
export const SHOP_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'avatar', label: 'Avatars' },
  { id: 'xpBoost', label: 'XP Boosts' },
  { id: 'nameColor', label: 'Name Colors' },
];

// Default shop items (if API fails or for testing)
export const DEFAULT_SHOP_ITEMS = [
  {
    _id: 'avatar1',
    type: 'avatar',
    title: 'Default Avatar',
    description: 'The default avatar for all users.',
    cost: 0,
    imageUrl: '/assets/avatars/default.png',
    unlockLevel: 1,
  },
  {
    _id: 'boost1',
    type: 'xpBoost',
    title: 'Basic XP Boost',
    description: 'Increases your XP gain by 10% for all activities.',
    cost: 500,
    effectValue: 1.1,
    unlockLevel: 5,
  },
  {
    _id: 'color1',
    type: 'nameColor',
    title: 'Purple',
    description: 'Change your name color to royal purple.',
    cost: 1000,
    effectValue: '#6543CC',
    unlockLevel: 10,
  },
];

// Error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_COINS: 'You do not have enough coins to purchase this item.',
  ALREADY_PURCHASED: 'You already own this item.',
  LEVEL_LOCKED: 'You need to reach a higher level to unlock this item.',
  PURCHASE_FAILED: 'Failed to purchase the item. Please try again later.',
  EQUIP_FAILED: 'Failed to equip the item. Please try again later.',
  FETCH_FAILED: 'Failed to fetch shop items. Please try again later.',
};
