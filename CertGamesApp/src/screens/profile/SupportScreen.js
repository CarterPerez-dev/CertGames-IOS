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
  StatusBar as RNStatusBar,
  Keyboard,
  Dimensions,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import {
  THREAD_STATUS,
  STATUS_INFO,
  CONNECTION_STATUS,
  EMPTY_STATES,
  PLACEHOLDERS,
} from '../../constants/supportConstants';
import { 
  fetchSupportThreads, 
  fetchSupportThread, 
  createSupportThread, 
  sendSupportMessage, 
  closeSupportThread 
} from '../../api/supportService';
import { BASE_URL } from '../../api/apiConfig';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

// Global socket instance
let socket = null;

// Constant keys for AsyncStorage
const THREADS_STORAGE_KEY = 'support_threads';
const MESSAGES_STORAGE_KEY = (threadId) => `support_messages_${threadId}`;
const SELECTED_THREAD_KEY = 'support_selected_thread';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SupportScreen = ({ navigation }) => {
  // Get theme and global styles
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState([...Array(5)].map(() => new Animated.Value(0)));
  
  // Get user ID from SecureStore on mount
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
  const [mobileThreadsVisible, setMobileThreadsVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Loading / error / socket states
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  
  // Refs
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const processedMessagesRef = useRef(new Set()); // Track processed messages
  const isComponentMounted = useRef(true);
  
  // Animation on mount
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
        delay: 200 + (i * 120),
        useNativeDriver: true
      }).start();
    });
  }, []);
  
  /////////////////////////////////////////////////////////////////////////
  // 1) Load userId from SecureStore
  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await SecureStore.getItemAsync('userId');
        if (id) {
          console.log('Retrieved userId from SecureStore:', id);
          setUserId(id);
        }
      } catch (err) {
        console.error('Error retrieving userId from SecureStore:', err);
      }
    };
    getUserId();
  }, []);
  
  // Listen for keyboard events with enhanced handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        // Get keyboard height from event
        const keyboardHeight = event.endCoordinates.height;
        console.log('Keyboard height:', keyboardHeight);
        setKeyboardVisible(true);
        // Scroll to bottom after keyboard appears
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  /////////////////////////////////////////////////////////////////////////
  // 2) useFocusEffect: fetch threads if we have a userId
  /////////////////////////////////////////////////////////////////////////
  useFocusEffect(
    useCallback(() => {
      console.log('Support screen is focused');
      if (userId) {
        // Fetch threads whenever the screen is focused
        fetchUserThreads();

        // Restore selected thread
        const restoreSelectedThread = async () => {
          try {
            const storedThreadId = await AsyncStorage.getItem(SELECTED_THREAD_KEY);
            if (storedThreadId) {
              console.log('Restoring selected thread:', storedThreadId);
              setSelectedThreadId(storedThreadId);
              loadMessagesForThread(storedThreadId);
            }
          } catch (err) {
            console.error('Error restoring selected thread:', err);
          }
        };
        restoreSelectedThread();
      }
      return () => {
        console.log('Support screen losing focus');
      };
    }, [userId])
  );
  
  /////////////////////////////////////////////////////////////////////////
  // 3) Initialize Socket.IO
  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    console.log('Setting up socket connection...');
    
    if (!socket) {
      // Derive base URL from your config
      const baseUrl = BASE_URL ? BASE_URL.replace(/\/api\/?$/, '') : 'https://certgames.com';
      console.log(`Initializing socket to: ${baseUrl}`);
      
      socket = io(baseUrl, {
        path: '/api/socket.io',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    
    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
      setSocketStatus('connected');
      
      // If we have a userId, join the personal room
      if (userId) {
        socket.emit('join_user_room', { userId });
        console.log(`Joined user room: user_${userId}`);
      }
      
      // Re-join current thread room if there is one
      if (selectedThreadId) {
        socket.emit('join_thread', { threadId: selectedThreadId, userId });
        console.log(`Rejoined thread room on connect: ${selectedThreadId}`);
      }
      
      // Also join all thread rooms if we have threads
      threads.forEach((thread) => {
        socket.emit('join_thread', { threadId: thread._id, userId });
        console.log(`Joined thread room for thread: ${thread._id}`);
      });
    };
    
    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setSocketStatus('disconnected');
    };
    
    const handleConnectError = (err) => {
      console.error('Socket connection error:', err);
      setSocketStatus('error');
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    
    // If already connected, manually trigger connect logic
    if (socket.connected) {
      handleConnect();
    }
    
    return () => {
      // Cleanup
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [userId, selectedThreadId, threads]);
  
  /////////////////////////////////////////////////////////////////////////
  // 4) Socket event listeners (on selectedThreadId change)
  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (payload) => {
      console.log('Received new_message event:', payload);
      const { threadId, message } = payload;
      
      // If message belongs to the currently selected thread
      if (threadId === selectedThreadId) {
        const signature = `${message.sender}:${message.content}:${message.timestamp}`;
        if (!processedMessagesRef.current.has(signature)) {
          processedMessagesRef.current.add(signature);
          
          setMessages((prev) => {
            const updated = [...prev, message];
            // Cache them
            AsyncStorage.setItem(MESSAGES_STORAGE_KEY(threadId), JSON.stringify(updated))
              .catch(err => console.error('Error saving messages:', err));
            return updated;
          });
          
          // Scroll to bottom after short delay
          setTimeout(() => {
            if (chatEndRef.current) {
              chatEndRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      }
      
      // Update lastUpdated in threads
      setThreads((prevThreads) => {
        const updated = prevThreads.map((t) => {
          if (t._id === threadId) {
            return { ...t, lastUpdated: message.timestamp };
          }
          return t;
        });
        // Cache
        AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated))
          .catch(err => console.error('Error saving threads:', err));
        return updated;
      });
    };
    
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
    
    const handleNewThread = (threadData) => {
      console.log('Received new_thread event:', threadData);
      setThreads((prev) => {
        if (prev.some((t) => t._id === threadData._id)) {
          return prev;
        }
        const updated = [threadData, ...prev];
        AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated))
          .catch(err => console.error('Error saving threads:', err));
        return updated;
      });
      // Join the new thread
      socket.emit('join_thread', { threadId: threadData._id, userId });
    };
    
    socket.on('new_message', handleNewMessage);
    socket.on('admin_typing', handleAdminTyping);
    socket.on('admin_stop_typing', handleAdminStopTyping);
    socket.on('new_thread', handleNewThread);
    
    if (selectedThreadId) {
      console.log(`Joining thread room: ${selectedThreadId}`);
      socket.emit('join_thread', { threadId: selectedThreadId, userId });
    }
    
    return () => {
      // Cleanup
      socket.off('new_message', handleNewMessage);
      socket.off('admin_typing', handleAdminTyping);
      socket.off('admin_stop_typing', handleAdminStopTyping);
      socket.off('new_thread', handleNewThread);
      
      // Leave the thread if we had one
      if (selectedThreadId) {
        socket.emit('leave_thread', { threadId: selectedThreadId });
      }
    };
  }, [selectedThreadId, userId]);
  
  /////////////////////////////////////////////////////////////////////////
  // 5) On mount, load persisted threads/messages from AsyncStorage
  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    isComponentMounted.current = true;
    
    const loadPersistedData = async () => {
      try {
        // Load threads
        const storedThreads = await AsyncStorage.getItem(THREADS_STORAGE_KEY);
        if (storedThreads) {
          console.log('Loaded threads from AsyncStorage');
          setThreads(JSON.parse(storedThreads));
        }
        // Load selected thread
        const storedThreadId = await AsyncStorage.getItem(SELECTED_THREAD_KEY);
        if (storedThreadId) {
          console.log('Loaded selected thread ID:', storedThreadId);
          setSelectedThreadId(storedThreadId);
          
          // Load messages for that thread
          const storedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY(storedThreadId));
          if (storedMessages) {
            console.log('Loaded messages from AsyncStorage for thread:', storedThreadId);
            const parsed = JSON.parse(storedMessages);
            setMessages(parsed);
            // Add to processed messages
            parsed.forEach((msg) => {
              processedMessagesRef.current.add(`${msg.sender}:${msg.content}:${msg.timestamp}`);
            });
          }
        }
      } catch (err) {
        console.error('Error loading persisted data:', err);
      }
    };
    
    loadPersistedData();
    // Also do an initial fetch if we have userId
    if (userId) {
      fetchUserThreads();
    }
    
    return () => {
      isComponentMounted.current = false;
    };
  }, [userId]);
  
  /////////////////////////////////////////////////////////////////////////
  // UTILS
  /////////////////////////////////////////////////////////////////////////
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    
    // Create date object from timestamp (ISO string from server)
    const date = new Date(ts);
    
    // Get today's date for comparison
    const today = new Date();
    
    // Compare year, month, and day directly (better for time zones)
    const isSameDay = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    // If the date is today, just show the time
    if (isSameDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getStatusInfo = (status = 'open') => {
    const s = status.toLowerCase();
    if (s.includes('open')) {
      return { 
        icon: 'radio-button-on', 
        label: 'Open', 
        color: theme.colors.success 
      };
    } else if (s.includes('pending')) {
      return { 
        icon: 'hourglass', 
        label: 'Pending', 
        color: theme.colors.warning 
      };
    } else if (s.includes('resolved')) {
      return { 
        icon: 'checkmark-circle', 
        label: 'Resolved', 
        color: theme.colors.info 
      };
    } else if (s.includes('closed')) {
      return { 
        icon: 'lock-closed', 
        label: 'Closed', 
        color: theme.colors.textMuted 
      };
    }
    return { 
      icon: 'radio-button-on', 
      label: 'Open', 
      color: theme.colors.success 
    };
  };
  
  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollToEnd({ animated: true });
    }
  }, []);
  
  /////////////////////////////////////////////////////////////////////////
  // FETCH THREADS
  /////////////////////////////////////////////////////////////////////////
  const fetchUserThreads = useCallback(async () => {
    if (!isComponentMounted.current || !userId) return;
    console.log('Fetching user threads...');
    setLoadingThreads(true);
    setError(null);
    try {
      const data = await fetchSupportThreads(); // from supportService
      if (!isComponentMounted.current) return;
      console.log(`Fetched ${data.length} threads from server`);
      
      setThreads(data);
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(data));
      
      // Join all thread rooms
      if (socket && socket.connected) {
        data.forEach((t) => {
          socket.emit('join_thread', { threadId: t._id, userId });
          console.log(`Joined thread room on load: ${t._id}`);
        });
      }
      
      // If we have a selected thread, refresh messages
      if (selectedThreadId) {
        loadMessagesForThread(selectedThreadId);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
      if (isComponentMounted.current) {
        setError(err.message || 'Failed to load conversations');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoadingThreads(false);
      }
    }
  }, [selectedThreadId, userId]);
  
  /////////////////////////////////////////////////////////////////////////
  // LOAD MESSAGES
  /////////////////////////////////////////////////////////////////////////
  const loadMessagesForThread = async (threadId) => {
    if (!threadId) return;
    console.log(`Loading messages for thread ${threadId}`);
    try {
      const threadData = await fetchSupportThread(threadId);
      if (!isComponentMounted.current) return;
      if (threadData && threadData.messages) {
        console.log(`Loaded ${threadData.messages.length} messages from server`);
        processedMessagesRef.current.clear();
        
        threadData.messages.forEach((m) => {
          processedMessagesRef.current.add(`${m.sender}:${m.content}:${m.timestamp}`);
        });
        
        setMessages(threadData.messages);
        await AsyncStorage.setItem(MESSAGES_STORAGE_KEY(threadId), JSON.stringify(threadData.messages));
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error loading messages for thread:', err);
    }
  };
  
  /////////////////////////////////////////////////////////////////////////
  // CREATE NEW THREAD
  /////////////////////////////////////////////////////////////////////////
  const createNewThread = async () => {
    if (!newThreadSubject.trim()) {
      setError('Please enter a subject for your thread');
      return;
    }
    console.log('Creating new thread:', newThreadSubject);
    setError(null);
    try {
      const newThread = await createSupportThread(newThreadSubject.trim());
      console.log('New thread created:', newThread);
      setThreads((prev) => [newThread, ...prev]);
      setNewThreadSubject('');
      
      const updated = [newThread, ...threads];
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
      
      // Select the new thread
      await selectThread(newThread._id);
      setMobileThreadsVisible(false);
      
      // Join the thread room
      if (socket && socket.connected) {
        socket.emit('join_thread', { threadId: newThread._id, userId });
        console.log(`Joined new thread: ${newThread._id}`);
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      setError(err.message || 'Failed to create thread');
    }
  };
  
  /////////////////////////////////////////////////////////////////////////
  // SELECT THREAD
  /////////////////////////////////////////////////////////////////////////
  const selectThread = async (threadId) => {
    if (threadId === selectedThreadId) {
      setMobileThreadsVisible(false);
      return;
    }
    console.log(`Selecting thread: ${threadId}`);
    
    // Leave old thread
    if (selectedThreadId && socket && socket.connected) {
      socket.emit('leave_thread', { threadId: selectedThreadId });
      console.log(`Left thread room: ${selectedThreadId}`);
    }
    
    setSelectedThreadId(threadId);
    await AsyncStorage.setItem(SELECTED_THREAD_KEY, threadId);
    
    setMessages([]);
    setLoadingMessages(true);
    setError(null);
    setMobileThreadsVisible(false);
    
    processedMessagesRef.current.clear();
    
    if (socket && socket.connected) {
      socket.emit('join_thread', { threadId, userId });
      console.log(`Joined thread room: ${threadId}`);
    }
    
    try {
      const cached = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY(threadId));
      if (cached) {
        console.log('Using cached messages while fetching server data');
        const parsed = JSON.parse(cached);
        setMessages(parsed);
        parsed.forEach((msg) => {
          processedMessagesRef.current.add(`${msg.sender}:${msg.content}:${msg.timestamp}`);
        });
        setTimeout(scrollToBottom, 100);
      }
      // Then fetch from server
      const threadData = await fetchSupportThread(threadId);
      if (!isComponentMounted.current) return;
      if (threadData && threadData.messages) {
        console.log(`Fetched ${threadData.messages.length} messages from server`);
        processedMessagesRef.current.clear();
        
        threadData.messages.forEach((msg) => {
          processedMessagesRef.current.add(`${msg.sender}:${msg.content}:${msg.timestamp}`);
        });
        setMessages(threadData.messages);
        
        await AsyncStorage.setItem(MESSAGES_STORAGE_KEY(threadId), JSON.stringify(threadData.messages));
        setTimeout(scrollToBottom, 100);
      }
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    } catch (err) {
      console.error('Error loading thread messages:', err);
      if (isComponentMounted.current) {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoadingMessages(false);
      }
    }
  };
  
  /////////////////////////////////////////////////////////////////////////
  // SEND MESSAGE
  /////////////////////////////////////////////////////////////////////////
  const sendMessage = async () => {
    if (!selectedThreadId) {
      setError('Please select a thread first');
      return;
    }
    if (!userMessage.trim()) {
      return;
    }
    console.log(`Sending message to thread ${selectedThreadId}`);
    setError(null);
    const toSend = userMessage.trim();
    
    // Create optimistic message
    const optimistic = {
      sender: 'user',
      content: toSend,
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    const updated = [...messages, optimistic];
    setMessages(updated);
    setUserMessage('');
    scrollToBottom();
    
    // Cache optimistically
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY(selectedThreadId), JSON.stringify(updated));
    
    // Stop typing
    if (socket && socket.connected) {
      socket.emit('user_stop_typing', { threadId: selectedThreadId });
    }
    setIsTyping(false);
    
    try {
      await sendSupportMessage(selectedThreadId, toSend);
      console.log('Message sent successfully');
      
      // Update thread lastUpdated
      const updatedThreads = threads.map((t) => {
        if (t._id === selectedThreadId) {
          return { ...t, lastUpdated: new Date().toISOString() };
        }
        return t;
      });
      setThreads(updatedThreads);
      await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
      
      // Reload messages to replace the optimistic with actual
      await loadMessagesForThread(selectedThreadId);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      
      // Remove optimistic message on error
      const filtered = messages.filter((msg) => !msg.optimistic);
      setMessages(filtered);
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY(selectedThreadId), JSON.stringify(filtered));
    }
  };
  
  /////////////////////////////////////////////////////////////////////////
  // TYPING HANDLER
  /////////////////////////////////////////////////////////////////////////
  const handleTyping = (text) => {
    setUserMessage(text);
    if (socket && socket.connected && selectedThreadId) {
      if (!isTyping && text.trim().length > 0) {
        socket.emit('user_typing', { threadId: selectedThreadId });
        setIsTyping(true);
      } else if (isTyping && text.trim().length === 0) {
        socket.emit('user_stop_typing', { threadId: selectedThreadId });
        setIsTyping(false);
      }
    }
  };
  
  /////////////////////////////////////////////////////////////////////////
  // CLOSE THREAD
  /////////////////////////////////////////////////////////////////////////
  const closeThread = async () => {
    if (!selectedThreadId) return;
    Alert.alert(
      'Close Conversation',
      'Are you sure you want to close this thread?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Closing thread ${selectedThreadId}`);
              await closeSupportThread(selectedThreadId);
              
              const updated = threads.map((t) => {
                if (t._id === selectedThreadId) {
                  return { ...t, status: 'closed' };
                }
                return t;
              });
              setThreads(updated);
              await AsyncStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
              
              // Reload to show closure message
              await loadMessagesForThread(selectedThreadId);
            } catch (err) {
              console.error('Error closing thread:', err);
              setError(err.message || 'Failed to close thread');
            }
          }
        }
      ]
    );
  };
  
  /////////////////////////////////////////////////////////////////////////
  // RENDER & UI
  /////////////////////////////////////////////////////////////////////////
  const selectedThread = threads.find((t) => t._id === selectedThreadId);
  const isThreadClosed = selectedThread?.status?.toLowerCase() === 'closed';
  
  const handleBackToThreads = () => {
    setMobileThreadsVisible(true);
  };
  
  // RENDER a single thread item
  const renderThreadItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const isActive = selectedThreadId === item._id;
    const isClosed = item.status?.toLowerCase() === 'closed';
    return (
      <TouchableOpacity
        style={[
          styles.threadItem,
          { 
            backgroundColor: theme.colors.surface,
            borderLeftColor: statusInfo.color,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
          isActive && [
            styles.threadItemActive, 
            { 
              backgroundColor: theme.colors.surfaceHighlight,
              borderLeftColor: theme.colors.primary,
              borderColor: theme.colors.primary + '40',
            }
          ],
          isClosed && [
            styles.threadItemClosed,
            { 
              opacity: 0.7,
              borderLeftColor: theme.colors.textMuted 
            }
          ]
        ]}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          selectThread(item._id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.threadItemHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={12} color={theme.colors.textInverse} />
          </View>
          <Text
            style={[
              styles.threadSubject, 
              { color: theme.colors.text, fontFamily: 'ShareTechMono' },
              isClosed && { color: theme.colors.textMuted }
            ]}
            numberOfLines={1}
          >
            {item.subject || 'Untitled Thread'}
          </Text>
        </View>
        <View style={styles.threadFooter}>
          <Text style={[styles.statusText, { color: statusInfo.color, fontFamily: 'ShareTechMono' }]}>
            {statusInfo.label}
          </Text>
          <Text style={[styles.timestampText, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
            {item.lastUpdated ? formatTimestamp(item.lastUpdated) : 'New'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // RENDER a single message
  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : isSystem
              ? styles.systemMessageContainer
              : styles.adminMessageContainer
        ]}
      >
        <View style={styles.messageAvatar}>
          <View
            style={[
              styles.avatarCircle,
              isUser
                ? [styles.userAvatarCircle, { backgroundColor: theme.colors.secondary }]
                : isSystem
                  ? [styles.systemAvatarCircle, { backgroundColor: theme.colors.info }]
                  : [styles.adminAvatarCircle, { backgroundColor: theme.colors.primary }]
            ]}
          >
            <Ionicons
              name={isUser ? "person" : isSystem ? "hardware-chip" : "person-circle"}
              size={isSystem ? 16 : 20}
              color={theme.colors.textInverse}
            />
          </View>
        </View>
        
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [
                  styles.userMessageBubble, 
                  { 
                    backgroundColor: `${theme.colors.secondary}20`, 
                    borderColor: `${theme.colors.secondary}30` 
                  }
                ]
              : isSystem
                ? [
                    styles.systemMessageBubble, 
                    { 
                      backgroundColor: `${theme.colors.info}20`,
                      borderColor: `${theme.colors.info}30`
                    }
                  ]
                : [
                    styles.adminMessageBubble, 
                    { 
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: `${theme.colors.primary}30`
                    }
                  ]
          ]}
        >
          {!isSystem && (
            <Text
              style={[
                styles.messageSender,
                isUser 
                  ? [styles.userMessageSender, { color: theme.colors.secondary, fontFamily: 'ShareTechMono' }] 
                  : [styles.adminMessageSender, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]
              ]}
            >
              {isUser ? 'You' : 'Support Team'}
            </Text>
          )}
          <Text style={[styles.messageContent, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTimestamp, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[globalStyles.screen]}>
      <RNStatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Fixed back button in top left */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      
      {/* Title Header */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent']}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={styles.headerBackground}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.mainTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
              SUPPORT
            </Text>
            <View style={[styles.headerDivider, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              ASK US ANYTHING!
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {error && (
        <View style={[
          styles.errorContainer, 
          { 
            backgroundColor: `${theme.colors.error}15`,
            borderLeftColor: theme.colors.error
          }
        ]}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>{error}</Text>
          <TouchableOpacity
            style={styles.errorCloseButton}
            onPress={() => setError(null)}
          >
            <Ionicons name="close" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {mobileThreadsVisible ? (
          // THREADS VIEW
          <Animated.View 
            style={[
              styles.threadsContainer,
              {
                opacity: cardAnims[0],
                transform: [{
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }
            ]}
          >
            
            <View style={[styles.createThreadCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            }]}>
              <View style={styles.createThreadForm}>
                <TextInput
                  style={[
                    styles.subjectInput, 
                    { 
                      backgroundColor: theme.colors.inputBackground, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      fontFamily: 'ShareTechMono'
                    }
                  ]}
                  placeholder="New Message"
                  placeholderTextColor={theme.colors.placeholder}
                  value={newThreadSubject}
                  onChangeText={setNewThreadSubject}
                  maxLength={100}
                />
                <TouchableOpacity
                  style={[
                    styles.createThreadButton,
                    { backgroundColor: theme.colors.primary },
                    !newThreadSubject.trim() && [
                      styles.createButtonDisabled, 
                      { backgroundColor: `${theme.colors.primary}70` }
                    ]
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    createNewThread();
                  }}
                  disabled={!newThreadSubject.trim()}
                >
                  <Ionicons name="add" size={20} color={theme.colors.textInverse} />
                  <Text style={[
                    styles.createButtonText, 
                    { color: theme.colors.textInverse, fontFamily: 'Orbitron' }
                  ]}>
                    CREATE
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.refreshButton, 
                    { backgroundColor: `${theme.colors.primary}20` }
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    fetchUserThreads();
                  }}
                >
                  <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                  <Text style={[styles.refreshButtonText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
                    REFRESH
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {loadingThreads ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                  LOADING CONVERSATIONS...
                </Text>
              </View>
            ) : threads.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.surface }]}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={60}
                  color={theme.colors.primary}
                  style={{ opacity: 0.5 }}
                />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  {EMPTY_STATES.NO_THREADS.title}
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                  {EMPTY_STATES.NO_THREADS.subtitle}
                </Text>
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
          </Animated.View>
        ) : (
          // MESSAGES VIEW
          <Animated.View 
            style={[
              styles.messagesContainer,
              {
                opacity: cardAnims[1],
                transform: [{
                  translateY: cardAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }
            ]}
          >
            {!selectedThreadId ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="mail-outline"
                  size={60}
                  color={theme.colors.primary}
                  style={{ opacity: 0.5 }}
                />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  {EMPTY_STATES.NO_THREAD_SELECTED.title}
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                  {EMPTY_STATES.NO_THREAD_SELECTED.subtitle}
                </Text>
              </View>
            ) : (
              <>
                <View style={[
                  styles.messagesHeader, 
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    shadowColor: theme.colors.shadow
                  }
                ]}>
                  <TouchableOpacity
                    style={styles.backToThreadsButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      handleBackToThreads();
                    }}
                  >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.threadInfoContainer}>
                    {selectedThread && (
                      <>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusInfo(selectedThread.status).color }
                          ]}
                        >
                          <Ionicons
                            name={getStatusInfo(selectedThread.status).icon}
                            size={12}
                            color={theme.colors.textInverse}
                          />
                        </View>
                        <Text 
                          style={[
                            styles.selectedThreadTitle, 
                            { color: theme.colors.text, fontFamily: 'Orbitron' }
                          ]} 
                          numberOfLines={1}
                        >
                          {selectedThread.subject}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  <View style={styles.messagesActions}>
                    {!isThreadClosed && selectedThread && (
                      <TouchableOpacity
                        style={[
                          styles.closeThreadButton,
                          { backgroundColor: `${theme.colors.error}90` }
                        ]}
                        onPress={() => {
                          if (Platform.OS === 'ios') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                          closeThread();
                        }}
                      >
                        <Ionicons name="lock-closed" size={20} color={theme.colors.textInverse} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={[
                  styles.messagesListContainer,
                  // Adjust content area when keyboard is visible
                  keyboardVisible && {
                    flex: 1
                  }
                ]}>
                  {loadingMessages ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={[styles.loadingText, { color: theme.colors.text, fontFamily: 'Orbitron' }]}>
                        LOADING MESSAGES...
                      </Text>
                    </View>
                  ) : messages.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons
                        name="chatbubbles-outline"
                        size={60}
                        color={theme.colors.primary}
                        style={{ opacity: 0.5 }}
                      />
                      <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                        {EMPTY_STATES.NO_MESSAGES.title}
                      </Text>
                      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                        {EMPTY_STATES.NO_MESSAGES.subtitle}
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      ref={chatEndRef}
                      data={messages}
                      renderItem={renderMessageItem}
                      keyExtractor={(item, index) => `msg-${index}-${item.timestamp}`}
                      contentContainerStyle={[
                        styles.messagesList,
                        keyboardVisible && { paddingBottom: 5 } // Less padding when keyboard visible
                      ]}
                      showsVerticalScrollIndicator={false}
                      onContentSizeChange={() => scrollToBottom()}
                      onLayout={() => scrollToBottom()}
                    />
                  )}
                  
                  {adminIsTyping && (
                    <View style={styles.typingIndicatorContainer}>
                      <View style={[
                        styles.adminAvatarCircle, 
                        { backgroundColor: theme.colors.primary }
                      ]}>
                        <Ionicons name="person-circle" size={20} color={theme.colors.textInverse} />
                      </View>
                      <View style={[
                        styles.typingBubble, 
                        { 
                          backgroundColor: `${theme.colors.primary}10`,
                          borderColor: `${theme.colors.primary}20`
                        }
                      ]}>
                        <View style={styles.typingDots}>
                          <View style={[
                            styles.typingDot, 
                            styles.typingDot1, 
                            { backgroundColor: theme.colors.primary, opacity: 0.7 }
                          ]} />
                          <View style={[
                            styles.typingDot, 
                            styles.typingDot2, 
                            { backgroundColor: theme.colors.primary, opacity: 0.5 }
                          ]} />
                          <View style={[
                            styles.typingDot, 
                            styles.typingDot3, 
                            { backgroundColor: theme.colors.primary, opacity: 0.3 }
                          ]} />
                        </View>
                        <Text style={[styles.typingText, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                          Support Team is typing...
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={[
                  styles.messageInputContainer, 
                  { 
                    borderTopColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 0 : 5) : 15
                  }
                ]}>
                  {isThreadClosed ? (
                    <View style={[
                      styles.threadClosedNotice, 
                      { backgroundColor: `${theme.colors.textMuted}20` }
                    ]}>
                      <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
                      <Text style={[styles.threadClosedText, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
                        This conversation is closed. Create a new one if needed.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        ref={messageInputRef}
                        style={[
                          styles.messageInput, 
                          { 
                            backgroundColor: theme.colors.inputBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            fontFamily: 'ShareTechMono'
                          }
                        ]}
                        placeholder="Type your message here..."
                        placeholderTextColor={theme.colors.placeholder}
                        value={userMessage}
                        onChangeText={handleTyping}
                        multiline
                        maxLength={2000}
                        editable={!isThreadClosed}
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          { backgroundColor: theme.colors.primary },
                          (!userMessage.trim() || isThreadClosed) && [
                            styles.sendButtonDisabled, 
                            { backgroundColor: `${theme.colors.primary}50` }
                          ]
                        ]}
                        onPress={() => {
                          if (Platform.OS === 'ios' && userMessage.trim()) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          sendMessage();
                        }}
                        disabled={!userMessage.trim() || isThreadClosed}
                      >
                        <Ionicons
                          name="paper-plane"
                          size={20}
                          color={
                            userMessage.trim() && !isThreadClosed
                              ? theme.colors.textInverse
                              : `${theme.colors.textInverse}70`
                          }
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Header section
  headerContainer: {
    height: 150,
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 33,
  },
  // Back button at top
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionTitleBg: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionTitleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    margin: 15,
    marginTop: 10,
    marginBottom: 5,
    borderLeftWidth: 4,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 5,
  },
  // Content container
  contentContainer: {
    flex: 1,
  },
  // Threads section
  threadsContainer: {
    flex: 1,
    marginBottom: 10,
  },
  createThreadCard: {
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createThreadForm: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  subjectInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  createThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    marginLeft: 6,
  },
  threadsList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  threadItem: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  threadItemActive: {
    borderLeftWidth: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  threadItemClosed: {
    opacity: 0.7,
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
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
  },
  
  // Messages section
  messagesContainer: {
    flex: 1,
  },
  messagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  backToThreadsButton: {
    marginRight: 10,
    padding: 5,
  },
  threadInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedThreadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  messagesActions: {
    marginLeft: 10,
  },
  closeThreadButton: {
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
    backgroundColor: '#4A90E2',
  },
  adminAvatarCircle: {
    backgroundColor: '#FF8C00',
  },
  systemAvatarCircle: {
    backgroundColor: '#7B68EE',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    maxWidth: '100%',
    borderWidth: 1,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
  },
  adminMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  systemMessageBubble: {
    borderRadius: 12,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  userMessageSender: {
    color: '#4A90E2',
  },
  adminMessageSender: {
    color: '#FF8C00',
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 11,
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
    borderRadius: 18,
    padding: 10,
    marginLeft: 8,
    borderWidth: 1,
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
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.8,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.4,
  },
  typingText: {
    fontSize: 14,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    borderRadius: 20,
    padding: Platform.OS === 'ios' ? 10 : 12,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  threadClosedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 20,
    padding: 15,
  },
  threadClosedText: {
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
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SupportScreen;
