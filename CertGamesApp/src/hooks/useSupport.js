// src/hooks/useSupport.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { 
  fetchSupportThreads, 
  createSupportThread, 
  fetchSupportThread, 
  sendSupportMessage, 
  closeSupportThread 
} from '../api/supportService';
import { 
  SOCKET_EVENTS, 
  CONNECTION_STATUS, 
  ERROR_MESSAGES 
} from '../constants/supportConstants';
import * as SecureStore from 'expo-secure-store';

// Socket instance (kept outside the hook to ensure singleton)
let socket = null;

/**
 * Custom hook for support functionality
 * @returns {Object} Support methods and state
 */
const useSupport = () => {
  // Get user ID from Redux
  const { userId } = useSelector((state) => state.user);
  
  // Threads and messages
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  
  // UI States
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [adminIsTyping, setAdminIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  
  // Refs
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const processedMessagesRef = useRef(new Set()); // Track processed messages to prevent duplicates
  
  // Create a message signature for duplicate detection
  const createMessageSignature = useCallback((message) => {
    return `${message.sender}:${message.content}:${message.timestamp}`;
  }, []);
  
  // Initialize or get the Socket.IO instance
  const initializeSocket = useCallback(async () => {
    if (socket) return socket;
    
    // Get the base URL from API configuration (we use the same URL for socket.io)
    const baseUrl = API_URL || 'https://certgames.com'; // Default fallback
    
    console.log('Initializing socket connection to:', baseUrl);
    
    socket = io(baseUrl, {
      path: '/api/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    return socket;
  }, []);
  
  // Setup socket event listeners
  const setupSocketEvents = useCallback(() => {
    if (!socket) return;
    
    // Connection events
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected:', socket.id);
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      
      // Join user's personal room
      socket.emit(SOCKET_EVENTS.JOIN_USER_ROOM, { userId });
      
      // Rejoin current thread if there is one
      if (selectedThreadId) {
        socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId: selectedThreadId });
      }
    });
    
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Socket disconnected');
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    });
    
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus(CONNECTION_STATUS.ERROR);
    });
    
    // Support-specific events
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (payload) => {
      console.log('Received new message:', payload);
      
      const { threadId, message } = payload;
      
      // Add message to current thread if it's selected
      if (threadId === selectedThreadId) {
        const messageSignature = createMessageSignature(message);
        
        // Only add if not a duplicate
        if (!processedMessagesRef.current.has(messageSignature)) {
          processedMessagesRef.current.add(messageSignature);
          
          setMessages((prev) => [...prev, message]);
          
          // Scroll to bottom after a short delay to ensure message is rendered
          setTimeout(() => {
            if (messageEndRef.current) {
              messageEndRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      }
      
      // Update thread's last updated timestamp
      setThreads((prev) =>
        prev.map((t) => {
          if (t._id === threadId) {
            return { ...t, lastUpdated: new Date().toISOString() };
          }
          return t;
        })
      );
    });
    
    socket.on(SOCKET_EVENTS.NEW_THREAD, (threadData) => {
      console.log('Received new thread:', threadData);
      
      // Add to threads list if not already there
      setThreads((prev) => {
        if (prev.some((t) => t._id === threadData._id)) {
          return prev;
        }
        return [threadData, ...prev];
      });
      
      // Join the thread room
      socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId: threadData._id });
    });
    
    socket.on(SOCKET_EVENTS.ADMIN_TYPING, (data) => {
      if (data.threadId === selectedThreadId) {
        setAdminIsTyping(true);
      }
    });
    
    socket.on(SOCKET_EVENTS.ADMIN_STOP_TYPING, (data) => {
      if (data.threadId === selectedThreadId) {
        setAdminIsTyping(false);
      }
    });
    
    // If already connected, handle connection
    if (socket.connected) {
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      socket.emit(SOCKET_EVENTS.JOIN_USER_ROOM, { userId });
      if (selectedThreadId) {
        socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId: selectedThreadId });
      }
    }
  }, [userId, selectedThreadId, createMessageSignature]);
  
  // Cleanup socket event listeners
  const cleanupSocketEvents = useCallback(() => {
    if (!socket) return;
    
    socket.off(SOCKET_EVENTS.CONNECT);
    socket.off(SOCKET_EVENTS.DISCONNECT);
    socket.off(SOCKET_EVENTS.CONNECT_ERROR);
    socket.off(SOCKET_EVENTS.NEW_MESSAGE);
    socket.off(SOCKET_EVENTS.NEW_THREAD);
    socket.off(SOCKET_EVENTS.ADMIN_TYPING);
    socket.off(SOCKET_EVENTS.ADMIN_STOP_TYPING);
  }, []);
  
  // Initialize socket on mount
  useEffect(() => {
    const initSocket = async () => {
      await initializeSocket();
      setupSocketEvents();
    };
    
    initSocket();
    
    // Cleanup on unmount
    return () => {
      cleanupSocketEvents();
      
      // Clear typing timeout if exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [initializeSocket, setupSocketEvents, cleanupSocketEvents]);
  
  // Load threads
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError(null);
    
    try {
      const threadsData = await fetchSupportThreads();
      setThreads(Array.isArray(threadsData) ? threadsData : []);
      
      // Join all thread rooms for real-time updates
      if (socket && socket.connected) {
        threadsData.forEach((thread) => {
          socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId: thread._id });
        });
      }
    } catch (err) {
      console.error('Error loading threads:', err);
      setError(ERROR_MESSAGES.FETCH_THREADS);
    } finally {
      setLoadingThreads(false);
    }
  }, []);
  
  // Create a new thread
  const createThread = useCallback(async (subject) => {
    if (!subject || !subject.trim()) {
      setError(ERROR_MESSAGES.EMPTY_SUBJECT);
      return null;
    }
    
    setError(null);
    
    try {
      const newThread = await createSupportThread(subject.trim());
      
      // Add to threads list
      setThreads((prev) => [newThread, ...prev]);
      
      // Clear the subject input
      setNewThreadSubject('');
      
      // Join the thread room
      if (socket && socket.connected) {
        socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId: newThread._id });
      }
      
      return newThread;
    } catch (err) {
      console.error('Error creating thread:', err);
      setError(ERROR_MESSAGES.CREATE_THREAD);
      return null;
    }
  }, []);
  
  // Select a thread and load its messages
  const selectThread = useCallback(async (threadId) => {
    // Skip if already selected
    if (threadId === selectedThreadId) return;
    
    // Leave current thread room if any
    if (selectedThreadId && socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.LEAVE_THREAD, { threadId: selectedThreadId });
    }
    
    setSelectedThreadId(threadId);
    setMessages([]);
    setLoadingMessages(true);
    setError(null);
    
    // Clear previously processed messages
    processedMessagesRef.current.clear();
    
    // Join new thread room
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN_THREAD, { threadId });
    }
    
    try {
      const threadData = await fetchSupportThread(threadId);
      
      // Add messages to processed set to prevent duplicates
      const loadedMessages = threadData.messages || [];
      loadedMessages.forEach(msg => {
        processedMessagesRef.current.add(createMessageSignature(msg));
      });
      
      setMessages(loadedMessages);
      
      // Scroll to bottom after a short delay
      setTimeout(() => {
        if (messageEndRef.current) {
          messageEndRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      return threadData;
    } catch (err) {
      console.error('Error loading thread messages:', err);
      setError(ERROR_MESSAGES.LOAD_MESSAGES);
      return null;
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedThreadId, createMessageSignature]);
  
  // Send a message
  const sendMessage = useCallback(async (content) => {
    if (!selectedThreadId) {
      setError(ERROR_MESSAGES.NO_THREAD_SELECTED);
      return false;
    }
    
    if (!content || !content.trim()) {
      setError(ERROR_MESSAGES.EMPTY_MESSAGE);
      return false;
    }
    
    setError(null);
    const trimmedContent = content.trim();
    
    // Create optimistic message
    const optimisticMsg = {
      sender: 'user',
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Add to messages for immediate feedback
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    
    // Scroll to bottom after adding message
    setTimeout(() => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollToEnd({ animated: true });
      }
    }, 50);
    
    // Stop typing indication
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.USER_STOP_TYPING, { threadId: selectedThreadId });
    }
    setIsTyping(false);
    
    try {
      await sendSupportMessage(selectedThreadId, trimmedContent);
      
      // Update thread in list
      setThreads((prev) =>
        prev.map((t) => {
          if (t._id === selectedThreadId) {
            return { ...t, lastUpdated: new Date().toISOString() };
          }
          return t;
        })
      );
      
      // Reload messages to get the confirmed message from server
      // This includes the server-generated timestamp
      await loadMessagesForThread(selectedThreadId);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(ERROR_MESSAGES.SEND_MESSAGE);
      
      // Remove the optimistic message
      setMessages((prev) => prev.filter((msg) => !msg.optimistic));
      return false;
    }
  }, [selectedThreadId]);
  
  // Reload messages for the current thread
  const loadMessagesForThread = useCallback(async (threadId) => {
    try {
      const threadData = await fetchSupportThread(threadId);
      
      // Clear previous processed messages when explicitly reloading
      processedMessagesRef.current.clear();
      
      // Add all messages to processed set
      const loadedMessages = threadData.messages || [];
      loadedMessages.forEach(msg => {
        processedMessagesRef.current.add(createMessageSignature(msg));
      });
      
      setMessages(loadedMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        if (messageEndRef.current) {
          messageEndRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      return true;
    } catch (err) {
      console.error('Error reloading messages:', err);
      return false;
    }
  }, [createMessageSignature]);
  
  // Handle typing indication
  const handleTyping = useCallback((text) => {
    setMessageText(text);
    
    // Send typing indicator if connected
    if (socket && socket.connected && selectedThreadId) {
      // If not already typing, send a typing event
      if (!isTyping && text.trim().length > 0) {
        socket.emit(SOCKET_EVENTS.USER_TYPING, { threadId: selectedThreadId });
        setIsTyping(true);
      }
      // If typing and text becomes empty, send a stop typing event
      else if (isTyping && text.trim().length === 0) {
        socket.emit(SOCKET_EVENTS.USER_STOP_TYPING, { threadId: selectedThreadId });
        setIsTyping(false);
      }
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          socket.emit(SOCKET_EVENTS.USER_STOP_TYPING, { threadId: selectedThreadId });
          setIsTyping(false);
        }
      }, 2000);
    }
  }, [selectedThreadId, isTyping]);
  
  // Close a thread
  const closeThread = useCallback(async () => {
    if (!selectedThreadId) return false;
    
    const confirmed = await new Promise((resolve) => {
      Alert.alert(
        "Close Conversation",
        "Are you sure you want to close this conversation?",
        [
          { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
          { text: "Close", onPress: () => resolve(true), style: "destructive" }
        ]
      );
    });
    
    if (!confirmed) return false;
    
    try {
      await closeSupportThread(selectedThreadId);
      
      // Update thread status in the list
      setThreads((prev) =>
        prev.map((t) => {
          if (t._id === selectedThreadId) {
            return { ...t, status: 'closed' };
          }
          return t;
        })
      );
      
      // Reload messages to show closure message
      await loadMessagesForThread(selectedThreadId);
      return true;
    } catch (err) {
      console.error('Error closing thread:', err);
      setError(ERROR_MESSAGES.CLOSE_THREAD);
      return false;
    }
  }, [selectedThreadId, loadMessagesForThread]);
  
  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format options for time
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], timeOptions)}`;
    }
    
    // If it's yesterday, show "Yesterday, time"
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], timeOptions)}`;
    }
    
    // Otherwise show the full date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    }) + ', ' + date.toLocaleTimeString([], timeOptions);
  }, []);
  
  // Check if a thread is closed
  const isThreadClosed = useCallback((threadId) => {
    const thread = threads.find(t => t._id === threadId);
    return thread?.status?.toLowerCase() === 'closed';
  }, [threads]);
  
  // Get the selected thread
  const getSelectedThread = useCallback(() => {
    return threads.find(t => t._id === selectedThreadId);
  }, [threads, selectedThreadId]);
  
  return {
    // State
    threads,
    messages,
    selectedThreadId,
    loadingThreads,
    loadingMessages,
    newThreadSubject,
    messageText,
    adminIsTyping,
    connectionStatus,
    error,
    messageEndRef,
    
    // Actions
    setNewThreadSubject,
    loadThreads,
    createThread,
    selectThread,
    sendMessage,
    handleTyping,
    closeThread,
    setError,
    formatTimestamp,
    isThreadClosed,
    getSelectedThread,
  };
};

export default useSupport;
