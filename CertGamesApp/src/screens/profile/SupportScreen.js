// src/screens/profile/SupportScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import {
  THREAD_STATUS,
  STATUS_INFO,
  CONNECTION_STATUS,
  EMPTY_STATES,
  PLACEHOLDERS,
  INFO_TEXTS
} from '../../constants/supportConstants';
import { 
  fetchSupportThreads, 
  fetchSupportThread, 
  createSupportThread, 
  sendSupportMessage, 
  closeSupportThread 
} from '../../api/supportService';
import { API } from '../../api/apiConfig';

// Global socket instance
let socket = null;

// Constant keys for AsyncStorage
const THREADS_STORAGE_KEY = 'support_threads';
const MESSAGES_STORAGE_KEY = (threadId) => `support_messages_${threadId}`;
const SELECTED_THREAD_KEY = 'support_selected_thread';

const SupportScreen = ({ navigation }) => {
  // Get user ID from SecureStore when component mounts
  const [userId, setUserId] = useState(null);
  
  // Thread and message states
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // UI states
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [adminIsTyping, setAdminIsTyping] = useState(false);
  const [showSupportInfoPopup, setShowSupportInfoPopup] = useState(true);
  const [mobileThreadsVisible, setMobileThreadsVisible] = useState(true);
  
  // Loading and error states
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  
  // Refs
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const processedMessagesRef = useRef(new Set()); // Track processed messages
  const isComponentMounted = useRef(true);
  const typingTimeoutRef = useRef(null);
  
  // Get user ID from SecureStore
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await SecureStore.getItemAsync('userId');
        if (id) setUserId(id);
      } catch (err) {
        console.error("Error retrieving userId from SecureStore:", err);
      }
    };
    
    getUserId();
  }, []);
  
  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Load threads
        const storedThreads = await AsyncStorage.getItem(THREADS_STORAGE_KEY);
        if (storedThreads) {
          setThreads(JSON.parse(storedThreads));
        }
        
        // Load selected thread ID
        const storedThreadId = await AsyncStorage.getItem(SELECTED_THREAD_KEY);
        if (storedThreadId) {
          setSelectedThreadId(storedThreadId);
          
          // Load messages for this thread
          const storedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY(storedThreadId));
          if (storedMessages) {
            const parsedMessages = JSON.parse(storedMessages);
            setMessages(parsedMessages);
            
            // Add to processed messages set
            parsedMessages.forEach(msg => {
              const signature = `${msg.sender}:${msg.content}:${msg.timestamp}`;
              processedMessagesRef.current.add(signature);
            });
          }
        }
      } catch (err) {
        console.error("Error loading persisted data:", err);
      }
    };
    
    loadPersistedData();
    
    // Initial fetch of threads from server
    fetchUserThreads();
  }, []);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    console.log("Setting up socket connection...");
    
    if (!socket) {
      // Get the base URL from your API config
      const baseUrl = API.BASE_URL.replace('/api', '');
      console.log(`Initializing socket to: ${baseUrl}`);
      
      socket = io(baseUrl, {
        path: '/api/socket.io',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: { userId } // Add userId to the connection query for authentication
      });
    }
    
    // Connection event handlers
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setSocketStatus('connected');
      
      // Join user's personal room for notifications
      if (userId) {
        socket.emit('join_user_room', { userId });
        console.log(`Joined user room: user_${userId}`);
      }
      
      // Re-join current thread room if there is one
      if (selectedThreadId) {
        socket.emit('join_thread', { threadId: selectedThreadId });
        console.log(`Rejoined thread room on connect: ${selectedThreadId}`);
      }
    };
    
    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setSocketStatus('disconnected');
    };
    
    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
      setSocketStatus('error');
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    
    // If socket is already connected, manually trigger connect handler
    if (socket.connected) {
      handleConnect();
    }
    
    return () => {
      // Cleanup
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [userId, selectedThreadId]);
  
  // Setup message listeners when selectedThreadId changes
  useEffect(() => {
    if (!socket) return;
    
    // Handle new messages from server
    const handleNewMessage = (payload) => {
      console.log("Received new_message event:", payload);
      const { threadId, message } = payload;
      
      // Only process if it's for the currently selected thread
      if (threadId === selectedThreadId) {
        // Create a signature to avoid duplicates
        const messageSignature = `${message.sender}:${message.content}:${message.timestamp}`;
        
        // Add the message if we haven't processed it before
        if (!processedMessagesRef.current.has(messageSignature)) {
          processedMessagesRef.current.add(messageSignature);
          
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, message];
            
            // Store updated messages in AsyncStorage
            AsyncStorage.setItem(
              MESSAGES_STORAGE_KEY(threadId), 
              JSON.stringify(updatedMessages)
            ).catch(err => console.error("Error saving messages:", err));
            
            return updatedMessages;
          });
          
          // Scroll to bottom
          setTimeout(() => {
            if (chatEndRef.current) {
              chatEndRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      }
      
      // Update thread's lastUpdated time in the threads list
      setThreads(prevThreads => {
        const updatedThreads = prevThreads.map(t => {
          if (t._id === threadId) {
            return { ...t, lastUpdated: message.timestamp };
          }
          return t;
        });
        
        // Save updated threads to AsyncStorage
        AsyncStorage.setItem(
          THREADS_STORAGE_KEY, 
          JSON.stringify(updatedThreads)
        ).catch(err => console.error("Error saving threads:", err));
        
        return updatedThreads;
      });
    };
    
    // Handle admin typing indicators
    const handleAdminTyping = (data) => {
      if (data.threadId === selectedThreadId) {
        setAdminIsTyping(true);
      }
    };
    
    const handleAdminStopTyping = (data) => {
      if (data.threadId === selectedThreadId) {
        setAdminIsTyping(false);
      }
    };
    
    // Handle new threads
    const handleNewThread = (threadData) => {
      console.log('Received new thread:', threadData);
      
      // Add to threads list if not already there
      setThreads(prevThreads => {
        if (prevThreads.some(t => t._id === threadData._id)) {
          return prevThreads;
        }
        
        const updatedThreads = [threadData, ...prevThreads];
        
        // Save updated threads to AsyncStorage
        AsyncStorage.setItem(
          THREADS_STORAGE_KEY, 
          JSON.stringify(updatedThreads)
        ).catch(err => console.error("Error saving threads:", err));
        
        return updatedThreads;
      });
      
      // Join the thread room
      socket.emit('join_thread', { threadId: threadData._id });
    };
    
    // Register listeners
    socket.on('new_message', handleNewMessage);
    socket.on('admin_typing', handleAdminTyping);
    socket.on('admin_stop_typing', handleAdminStopTyping);
    socket.on('new_thread', handleNewThread);
    
    // Join the thread room if we have a selected thread
    if (selectedThreadId) {
      console.log(`Joining thread room: ${selectedThreadId}`);
      socket.emit('join_thread', { threadId: selectedThreadId });
    }
    
    return () => {
      // Cleanup listeners when component unmounts or selectedThreadId changes
      socket.off('new_message', handleNewMessage);
      socket.off('admin_typing', handleAdminTyping);
      socket.off('admin_stop_typing', handleAdminStopTyping);
      socket.off('new_thread', handleNewThread);
      
      // Leave the thread room if we have a selected thread
      if (selectedThreadId) {
        socket.emit('leave_thread', { threadId: selectedThreadId });
      }
    };
  }, [selectedThreadId]);
  
  // Component cleanup
  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      isComponentMounted.current = false;
      
      // Clear any typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Format timestamps
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    
    // If it's today, just show the time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get thread status icon and color
  const getStatusInfo = (status = 'open') => {
    const s = status?.toLowerCase() || 'open';
    
    if (s.includes('open')) {
      return { icon: 'radio-button-on', label: 'Open', className: 'status-open', color: '#2ebb77' };
    }
    if (s.includes('pending')) {
      return { icon: 'hourglass', label: 'Pending', className: 'status-pending', color: '#ffc107' };
    }
    if (s.includes('resolved')) {
      return { icon: 'checkmark-circle', label: 'Resolved', className: 'status-resolved', color: '#3498db' };
    }
    if (s.includes('closed')) {
      return { icon: 'lock-closed', label: 'Closed', className: 'status-closed', color: '#9da8b9' };
    }
    
    return { icon: 'radio-button-on', label: 'Open', className: 'status-open', color: '#2ebb77' };
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollToEnd({ animated: true });
    }
  }, []);
  
  // Persist thread and message data
  const persistData = async (threadId, messageList, threadsList) => {
    try {
      // Save messages for the thread
      if (threadId && messageList) {
        await AsyncStorage.setItem(
          MESSAGES_STORAGE_KEY(threadId),
          JSON.stringify(messageList)
        );
      }
      
      // Save threads list
      if (threadsList) {
        await AsyncStorage.setItem(
          THREADS_STORAGE_KEY,
          JSON.stringify(threadsList)
        );
      }
      
      // Save selected thread ID
      if (threadId) {
        await AsyncStorage.setItem(SELECTED_THREAD_KEY, threadId);
      }
    } catch (err) {
      console.error("Error persisting data:", err);
    }
  };
  
  //////////////////////////////////////////////////////////////////////////
  // FETCH THREADS - Get user's support threads
  //////////////////////////////////////////////////////////////////////////
  const fetchUserThreads = useCallback(async () => {
    if (!isComponentMounted.current) return;
    
    setLoadingThreads(true);
    setError(null);
    
    try {
      const threadsData = await fetchSupportThreads();
      
      if (!isComponentMounted.current) return;
      
      // Update threads in state
      setThreads(threadsData);
      
      // Save threads to AsyncStorage
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threadsData));
      
      // Join all thread rooms for real-time updates
      if (socket && socket.connected) {
        threadsData.forEach((t) => {
          socket.emit('join_thread', { threadId: t._id });
          console.log(`Joined thread room on load: ${t._id}`);
        });
      }
      
      // If we have a selected thread, refresh its messages
      if (selectedThreadId) {
        loadMessagesForThread(selectedThreadId);
      }
    } catch (err) {
      if (!isComponentMounted.current) return;
      
      setError(err.message || "Failed to load conversations");
      console.error('Error fetching threads:', err);
    } finally {
      if (isComponentMounted.current) {
        setLoadingThreads(false);
      }
    }
  }, [selectedThreadId]);
  
  // Load messages for a specific thread
  const loadMessagesForThread = async (threadId) => {
    try {
      const threadData = await fetchSupportThread(threadId);
      
      if (!isComponentMounted.current) return;
      
      if (threadData.messages) {
        // Clear processed messages set
        processedMessagesRef.current.clear();
        
        // Process new messages
        threadData.messages.forEach(msg => {
          const signature = `${msg.sender}:${msg.content}:${msg.timestamp}`;
          processedMessagesRef.current.add(signature);
        });
        
        // Update messages state
        setMessages(threadData.messages);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(
          MESSAGES_STORAGE_KEY(threadId), 
          JSON.stringify(threadData.messages)
        );
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error loading messages for thread:', err);
    }
  };
  
  //////////////////////////////////////////////////////////////////////////
  // CREATE THREAD - Start a new support thread
  //////////////////////////////////////////////////////////////////////////
  const createNewThread = async () => {
    if (!newThreadSubject.trim()) {
      setError('Please enter a subject for your thread');
      return;
    }
    
    setError(null);
    
    try {
      const newThread = await createSupportThread(newThreadSubject.trim());
      
      // Add new thread to state
      const updatedThreads = [newThread, ...threads];
      setThreads(updatedThreads);
      setNewThreadSubject('');
      
      // Save updated threads to AsyncStorage
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
      
      // Select the newly created thread
      await selectThread(newThread._id);
      
      // On mobile, show the messages panel after creating a thread
      setMobileThreadsVisible(false);
      
      // Join the thread room
      if (socket && socket.connected) {
        socket.emit('join_thread', { threadId: newThread._id });
        console.log(`Joined new thread: ${newThread._id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to create thread");
      console.error('Error creating thread:', err);
    }
  };
  
  //////////////////////////////////////////////////////////////////////////
  // SELECT THREAD - Load messages for a thread
  //////////////////////////////////////////////////////////////////////////
  const selectThread = async (threadId) => {
    // Skip if already selected
    if (threadId === selectedThreadId) {
      // On mobile, just toggle to messages view
      setMobileThreadsVisible(false);
      return;
    }
    
    // Leave current thread room if any
    if (selectedThreadId && socket && socket.connected) {
      socket.emit('leave_thread', { threadId: selectedThreadId });
      console.log(`Left thread room: ${selectedThreadId}`);
    }
    
    // Update selected thread ID
    setSelectedThreadId(threadId);
    
    // Store selected thread ID in AsyncStorage
    await AsyncStorage.setItem(SELECTED_THREAD_KEY, threadId);
    
    // Reset messages and show loading state
    setMessages([]);
    setLoadingMessages(true);
    setError(null);
    
    // On mobile, show the messages panel
    setMobileThreadsVisible(false);
    
    // Clear the processed messages set
    processedMessagesRef.current.clear();
    
    // Join new thread room
    if (socket && socket.connected) {
      socket.emit('join_thread', { threadId });
      console.log(`Joined thread room: ${threadId}`);
    }
    
    try {
      // First check if we have cached messages
      const cachedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY(threadId));
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        setMessages(parsedMessages);
        
        // Add to processed messages set
        parsedMessages.forEach(msg => {
          const signature = `${msg.sender}:${msg.content}:${msg.timestamp}`;
          processedMessagesRef.current.add(signature);
        });
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
      
      // Then fetch fresh messages from server
      const threadData = await fetchSupportThread(threadId);
      
      if (!isComponentMounted.current) return;
      
      if (threadData.messages) {
        // Clear processed messages and rebuild
        processedMessagesRef.current.clear();
        
        threadData.messages.forEach(msg => {
          const signature = `${msg.sender}:${msg.content}:${msg.timestamp}`;
          processedMessagesRef.current.add(signature);
        });
        
        // Update messages state
        setMessages(threadData.messages);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(
          MESSAGES_STORAGE_KEY(threadId), 
          JSON.stringify(threadData.messages)
        );
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
      
      // Focus on message input
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    } catch (err) {
      if (!isComponentMounted.current) return;
      
      setError(err.message || "Failed to load messages");
      console.error('Error loading thread messages:', err);
    } finally {
      if (isComponentMounted.current) {
        setLoadingMessages(false);
      }
    }
  };
  
  //////////////////////////////////////////////////////////////////////////
  // SEND MESSAGE - Send a message in the current thread
  //////////////////////////////////////////////////////////////////////////
  const sendMessage = async () => {
    if (!selectedThreadId) {
      setError('Please select a thread first');
      return;
    }
    
    if (!userMessage.trim()) {
      return;
    }
    
    setError(null);
    const messageToSend = userMessage.trim();
    
    // Create optimistic message
    const optimisticMessage = {
      sender: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Update UI immediately with optimistic message
    const updatedMessages = [...messages, optimisticMessage];
    setMessages(updatedMessages);
    setUserMessage('');
    scrollToBottom();
    
    // Store in AsyncStorage (including the optimistic message)
    await AsyncStorage.setItem(
      MESSAGES_STORAGE_KEY(selectedThreadId), 
      JSON.stringify(updatedMessages)
    );
    
    // Stop typing indicator
    if (socket && socket.connected) {
      socket.emit('user_stop_typing', { threadId: selectedThreadId });
    }
    setIsTyping(false);
    
    try {
      // Send to server
      await sendSupportMessage(selectedThreadId, messageToSend);
      
      // Update the thread's last updated time
      const updatedThreads = threads.map(t => {
        if (t._id === selectedThreadId) {
          return { ...t, lastUpdated: new Date().toISOString() };
        }
        return t;
      });
      
      setThreads(updatedThreads);
      
      // Store updated threads in AsyncStorage
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
      
      // Replace optimistic message with confirmed one
      const confirmedMessages = updatedMessages.map(msg => 
        msg.optimistic ? { ...msg, optimistic: false } : msg
      );
      
      setMessages(confirmedMessages);
      
      // Update AsyncStorage with confirmed messages
      await AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY(selectedThreadId), 
        JSON.stringify(confirmedMessages)
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || "Failed to send message");
      
      // Remove optimistic message on error
      const filteredMessages = messages.filter(msg => !msg.optimistic);
      setMessages(filteredMessages);
      
      // Update AsyncStorage with filtered messages
      await AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY(selectedThreadId), 
        JSON.stringify(filteredMessages)
      );
    }
  };
  
  //////////////////////////////////////////////////////////////////////////
  // TYPING HANDLERS - Handle user typing events
  //////////////////////////////////////////////////////////////////////////
  const handleTyping = (text) => {
    setUserMessage(text);
    
    // Emit typing events
    if (socket && socket.connected && selectedThreadId) {
      if (!isTyping && text.trim().length > 0) {
        socket.emit('user_typing', { threadId: selectedThreadId });
        setIsTyping(true);
      } else if (isTyping && text.trim().length === 0) {
        socket.emit('user_stop_typing', { threadId: selectedThreadId });
        setIsTyping(false);
      }
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          socket.emit('user_stop_typing', { threadId: selectedThreadId });
          setIsTyping(false);
        }
      }, 2000);
    }
  };
  
  // Handle message input keydown (for Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Close thread (user-initiated)
  const closeThread = async () => {
    if (!selectedThreadId) return;
    
    Alert.alert(
      'Close Conversation',
      'Are you sure you want to close this thread?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Close',
          onPress: async () => {
            try {
              await closeSupportThread(selectedThreadId);
              
              // Update thread status in the list
              const updatedThreads = threads.map(t => {
                if (t._id === selectedThreadId) {
                  return { ...t, status: 'closed' };
                }
                return t;
              });
              
              setThreads(updatedThreads);
              
              // Store updated threads in AsyncStorage
              await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
              
              // Reload messages to show closure message
              await loadMessagesForThread(selectedThreadId);
            } catch (err) {
              setError(err.message || "Failed to close thread");
              console.error('Error closing thread:', err);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Check if selected thread is closed
  const selectedThread = threads.find(t => t._id === selectedThreadId);
  const isThreadClosed = selectedThread?.status?.toLowerCase() === 'closed';
  
  // Handle back button on mobile
  const handleBackToThreads = () => {
    setMobileThreadsVisible(true);
  };
  
  // Render thread item
  const renderThreadItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const isActive = selectedThreadId === item._id;
    const isClosed = item.status?.toLowerCase() === 'closed';
    
    return (
      <TouchableOpacity
        style={[
          styles.threadItem,
          isActive && styles.threadItemActive,
          isClosed && styles.threadItemClosed
        ]}
        onPress={() => selectThread(item._id)}
      >
        <View style={styles.threadItemHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={12} color="#FFFFFF" />
          </View>
          <Text style={[
            styles.threadSubject,
            isClosed && styles.threadTextClosed
          ]} numberOfLines={1}>
            {item.subject || "Untitled Thread"}
          </Text>
        </View>
        <View style={styles.threadFooter}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          <Text style={styles.timestampText}>
            {item.lastUpdated ? formatTimestamp(item.lastUpdated) : 'New'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render message item
  const renderMessageItem = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : isSystem ? styles.systemMessageContainer : styles.adminMessageContainer
        ]}
      >
        <View style={styles.messageAvatar}>
          <View style={[
            styles.avatarCircle,
            isUser ? styles.userAvatarCircle : isSystem ? styles.systemAvatarCircle : styles.adminAvatarCircle
          ]}>
            <Ionicons 
              name={isUser ? "person" : isSystem ? "hardware-chip" : "person-circle"} 
              size={isSystem ? 16 : 20}
              color="#FFFFFF" 
            />
          </View>
        </View>
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : isSystem ? styles.systemMessageBubble : styles.adminMessageBubble
        ]}>
          {!isSystem && (
            <Text style={[
              styles.messageSender,
              isUser ? styles.userMessageSender : styles.adminMessageSender
            ]}>
              {isUser ? 'You' : 'Support Team'}
            </Text>
          )}
          
          <Text style={styles.messageContent}>{item.content}</Text>
          
          <Text style={styles.messageTimestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Support / Ask Anything</Text>
        
        {showSupportInfoPopup && (
          <View style={styles.infoBanner}>
            <View style={styles.infoContent}>
              <Ionicons name="flash" size={20} color="#6543CC" />
              <Text style={styles.infoText}>{INFO_TEXTS.RESPONSE_TIME}</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoCloseButton}
              onPress={() => setShowSupportInfoPopup(false)}
            >
              <Ionicons name="close" size={18} color="#9DA8B9" />
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.subtitle}>
          {INFO_TEXTS.SUPPORT_SUBTITLE}
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF4E4E" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorCloseButton}
            onPress={() => setError(null)}
          >
            <Ionicons name="close" size={18} color="#9DA8B9" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.connectionStatus}>
        <View style={[
          styles.connectionIndicator, 
          socketStatus === 'connected' 
            ? styles.connectionIndicatorConnected
            : socketStatus === 'disconnected'
              ? styles.connectionIndicatorDisconnected
              : styles.connectionIndicatorError
        ]} />
        <Text style={styles.connectionText}>
          {socketStatus === 'connected' 
            ? 'Real-time connection active' 
            : socketStatus === 'disconnected'
              ? 'Connecting to real-time service...'
              : 'Connection error - messages may be delayed'}
        </Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {mobileThreadsVisible ? (
          // THREADS VIEW
          <View style={styles.threadsContainer}>
            <View style={styles.threadListHeader}>
              <Text style={styles.threadListTitle}>Your Conversations</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchUserThreads}
              >
                <Ionicons name="refresh" size={22} color="#6543CC" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.createThreadForm}>
              <TextInput
                style={styles.subjectInput}
                placeholder="New conversation subject..."
                placeholderTextColor="#9DA8B9"
                value={newThreadSubject}
                onChangeText={setNewThreadSubject}
                maxLength={100}
              />
              <TouchableOpacity 
                style={[
                  styles.createThreadButton,
                  !newThreadSubject.trim() && styles.createButtonDisabled
                ]}
                onPress={createNewThread}
                disabled={!newThreadSubject.trim()}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
            
            {loadingThreads ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6543CC" />
                <Text style={styles.loadingText}>Loading conversations...</Text>
              </View>
            ) : threads.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="happy-outline" size={60} color="#6543CC" style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>{EMPTY_STATES.NO_THREADS.title}</Text>
                <Text style={styles.emptyStateSubtitle}>{EMPTY_STATES.NO_THREADS.subtitle}</Text>
              </View>
            ) : (
              <FlatList
                data={threads}
                renderItem={renderThreadItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.threadsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : (
          // MESSAGES VIEW
          <View style={styles.messagesContainer}>
            {!selectedThreadId ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="mail-outline" size={60} color="#6543CC" style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>{EMPTY_STATES.NO_THREAD_SELECTED.title}</Text>
                <Text style={styles.emptyStateSubtitle}>{EMPTY_STATES.NO_THREAD_SELECTED.subtitle}</Text>
              </View>
            ) : (
              <>
                <View style={styles.messagesHeader}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleBackToThreads}
                  >
                    <Ionicons name="arrow-back" size={24} color="#6543CC" />
                  </TouchableOpacity>
                  
                  <View style={styles.threadInfoContainer}>
                    {selectedThread && (
                      <>
                        <View style={[
                          styles.statusIndicator, 
                          { backgroundColor: getStatusInfo(selectedThread.status).color }
                        ]}>
                          <Ionicons 
                            name={getStatusInfo(selectedThread.status).icon} 
                            size={12} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <Text style={styles.selectedThreadTitle} numberOfLines={1}>
                          {selectedThread.subject}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  <View style={styles.messagesActions}>
                    {!isThreadClosed && selectedThread && (
                      <TouchableOpacity 
                        style={styles.closeThreadButton} 
                        onPress={closeThread}
                      >
                        <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={styles.messagesListContainer}>
                  {loadingMessages ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#6543CC" />
                      <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                  ) : messages.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons name="chatbubbles-outline" size={60} color="#6543CC" style={{ opacity: 0.5 }} />
                      <Text style={styles.emptyStateTitle}>{EMPTY_STATES.NO_MESSAGES.title}</Text>
                      <Text style={styles.emptyStateSubtitle}>{EMPTY_STATES.NO_MESSAGES.subtitle}</Text>
                    </View>
                  ) : (
                    <FlatList
                      ref={chatEndRef}
                      data={messages}
                      renderItem={renderMessageItem}
                      keyExtractor={(item, index) => `msg-${index}-${item.timestamp}`}
                      contentContainerStyle={styles.messagesList}
                      showsVerticalScrollIndicator={false}
                      onContentSizeChange={() => scrollToBottom()}
                    />
                  )}
                  
                  {adminIsTyping && (
                    <View style={styles.typingIndicatorContainer}>
                      <View style={styles.adminAvatarCircle}>
                        <Ionicons name="person-circle" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.typingBubble}>
                        <View style={styles.typingDots}>
                          <View style={[styles.typingDot, styles.typingDot1]} />
                          <View style={[styles.typingDot, styles.typingDot2]} />
                          <View style={[styles.typingDot, styles.typingDot3]} />
                        </View>
                        <Text style={styles.typingText}>Support Team is typing...</Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={styles.messageInputContainer}>
                  {isThreadClosed ? (
                    <View style={styles.threadClosedNotice}>
                      <Ionicons name="lock-closed" size={20} color="#9DA8B9" />
                      <Text style={styles.threadClosedText}>
                        This conversation is closed. You can create a new one if needed.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        ref={messageInputRef}
                        style={styles.messageInput}
                        placeholder="Type your message here..."
                        placeholderTextColor="#9DA8B9"
                        value={userMessage}
                        onChangeText={handleTyping}
                        multiline
                        maxLength={2000}
                        editable={!isThreadClosed}
                      />
                      
                      <TouchableOpacity 
                        style={[
                          styles.sendButton,
                          (!userMessage.trim() || isThreadClosed) && styles.sendButtonDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!userMessage.trim() || isThreadClosed}
                      >
                        <Ionicons 
                          name="paper-plane" 
                          size={20} 
                          color={userMessage.trim() && !isThreadClosed ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"} 
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 5,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
  },
  infoCloseButton: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 78, 0.1)',
    borderRadius: 8,
    padding: 12,
    margin: 15,
    marginTop: 0,
  },
  errorText: {
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 5,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectionIndicatorConnected: {
    backgroundColor: '#2ebb77',
  },
  connectionIndicatorDisconnected: {
    backgroundColor: '#ffc107',
  },
  connectionIndicatorError: {
    backgroundColor: '#FF4E4E',
  },
  connectionText: {
    fontSize: 13,
    color: '#9DA8B9',
  },
  contentContainer: {
    flex: 1,
  },
  
  // Threads Panel
  threadsContainer: {
    flex: 1,
    padding: 15,
  },
  threadListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  threadListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
  },
  createThreadForm: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  subjectInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  createThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6543CC',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 5,
  },
  threadsList: {
    paddingBottom: 20,
  },
  threadItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6543CC',
  },
  threadItemActive: {
    backgroundColor: 'rgba(101, 67, 204, 0.2)',
    borderLeftColor: '#8A58FC',
  },
  threadItemClosed: {
    opacity: 0.7,
    borderLeftColor: '#9DA8B9',
  },
  threadItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  threadSubject: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  threadTextClosed: {
    color: '#9DA8B9',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 12,
    color: '#9DA8B9',
  },
  
  // Messages Panel
  messagesContainer: {
    flex: 1,
  },
  messagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 10,
  },
  threadInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedThreadTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  messagesActions: {
    marginLeft: 10,
  },
  closeThreadButton: {
    backgroundColor: 'rgba(255, 78, 78, 0.7)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesListContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  adminMessageContainer: {
    alignSelf: 'flex-start',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarCircle: {
    backgroundColor: '#FF4C8B',
  },
  adminAvatarCircle: {
    backgroundColor: '#6543CC',
  },
  systemAvatarCircle: {
    backgroundColor: '#3498DB',
  },
  messageBubble: {
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    padding: 12,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 139, 0.3)',
  },
  adminMessageBubble: {
    backgroundColor: 'rgba(134, 88, 252, 0.1)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(134, 88, 252, 0.3)',
  },
  systemMessageBubble: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  userMessageSender: {
    color: '#FF4C8B',
  },
  adminMessageSender: {
    color: '#6543CC',
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#9DA8B9',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    paddingTop: 0,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(134, 88, 252, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(134, 88, 252, 0.2)',
    borderRadius: 18,
    padding: 10,
    marginLeft: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6543CC',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.7,
    backgroundColor: '#6543CC',
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationIterationCount: 'infinite',
  },
  typingDot2: {
    opacity: 0.5,
    backgroundColor: '#6543CC',
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.2s',
    animationIterationCount: 'infinite',
  },
  typingDot3: {
    opacity: 0.3,
    backgroundColor: '#6543CC',
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.4s',
    animationIterationCount: 'infinite',
  },
  typingText: {
    color: '#9DA8B9',
    fontSize: 14,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    maxHeight: 120,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sendButton: {
    backgroundColor: '#6543CC',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
  },
  threadClosedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(157, 168, 185, 0.1)',
    borderRadius: 20,
    padding: 15,
  },
  threadClosedText: {
    color: '#9DA8B9',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
  },
  emptyStateSubtitle: {
    color: '#9DA8B9',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SupportScreen;
