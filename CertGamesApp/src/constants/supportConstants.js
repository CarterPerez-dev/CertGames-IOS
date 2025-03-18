// src/constants/supportConstants.js

// Thread status types
export const THREAD_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Status display information
export const STATUS_INFO = {
  open: {
    label: 'Open',
    color: '#2ebb77', // Green
    iconName: 'radio-button-on',
  },
  pending: {
    label: 'Pending',
    color: '#ffc107', // Amber
    iconName: 'hourglass',
  },
  resolved: {
    label: 'Resolved',
    color: '#3498db', // Blue
    iconName: 'checkmark-circle',
  },
  closed: {
    label: 'Closed',
    color: '#9da8b9', // Gray
    iconName: 'lock-closed',
  },
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  JOIN_THREAD: 'join_thread',
  LEAVE_THREAD: 'leave_thread',
  JOIN_USER_ROOM: 'join_user_room',
  NEW_MESSAGE: 'new_message',
  NEW_THREAD: 'new_thread',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  ADMIN_TYPING: 'admin_typing',
  ADMIN_STOP_TYPING: 'admin_stop_typing',
};

// Connection status
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

// Error messages
export const ERROR_MESSAGES = {
  FETCH_THREADS: 'Failed to load your conversations. Please try again.',
  CREATE_THREAD: 'Failed to create a new conversation. Please try again.',
  LOAD_MESSAGES: 'Failed to load messages. Please try again.',
  SEND_MESSAGE: 'Failed to send your message. Please try again.',
  CLOSE_THREAD: 'Failed to close the conversation. Please try again.',
  SOCKET_ERROR: 'Connection error. Messages may be delayed.',
  EMPTY_SUBJECT: 'Please enter a subject for your conversation.',
  NO_THREAD_SELECTED: 'Please select a conversation first.',
  EMPTY_MESSAGE: 'Please enter a message.',
};

// Placeholder texts
export const PLACEHOLDERS = {
  NEW_THREAD: 'New conversation subject...',
  MESSAGE_INPUT: 'Type your message here...',
};

// Info texts
export const INFO_TEXTS = {
  RESPONSE_TIME: 'We typically respond within 1-24 hours (average ~3 hours)',
  SUPPORT_SUBTITLE: 'Ask us anything about exams, this website, or technical issues. We\'re here to help!',
};

// Empty state messages
export const EMPTY_STATES = {
  NO_THREADS: {
    title: 'No conversations yet',
    subtitle: 'Create one to get started',
  },
  NO_MESSAGES: {
    title: 'No messages in this conversation yet',
    subtitle: 'Start the conversation by sending a message',
  },
  NO_THREAD_SELECTED: {
    title: 'No conversation selected',
    subtitle: 'Choose a conversation from the list or create a new one',
  },
};
