// src/screens/profile/SupportScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
import useSupport from '../../hooks/useSupport';
import {
  THREAD_STATUS,
  STATUS_INFO,
  CONNECTION_STATUS,
  EMPTY_STATES,
  PLACEHOLDERS,
  INFO_TEXTS
} from '../../constants/supportConstants';

const SupportScreen = ({ navigation }) => {
  // Use the support hook
  const {
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
    getSelectedThread
  } = useSupport();
  
  // Local state for UI
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('threads'); // 'threads' or 'messages'
  
  // Refs
  const subjectInputRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Effect to load threads when component mounts
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);
  
  // Create a new thread
  const handleCreateThread = async () => {
    if (!newThreadSubject.trim()) {
      setError('Please enter a subject for your conversation');
      return;
    }
    
    const newThread = await createThread(newThreadSubject);
    if (newThread) {
      // Auto-select the new thread
      await selectThread(newThread._id);
      setViewMode('messages');
      setShowCreateForm(false);
      
      // Focus the message input after a short delay
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 500);
    }
  };
  
  // Handle thread selection
  const handleSelectThread = async (threadId) => {
    await selectThread(threadId);
    setViewMode('messages');
    
    // Focus the message input if thread is not closed
    if (!isThreadClosed(threadId)) {
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 300);
    }
  };
  
  // Send a message in the selected thread
  const handleSendMessage = async () => {
    Keyboard.dismiss();
    await sendMessage(messageText);
  };
  
  // Handle closing a thread
  const handleCloseThread = async () => {
    const success = await closeThread();
    if (success) {
      Alert.alert(
        "Conversation Closed",
        "This conversation has been closed. You can start a new one if you need further assistance."
      );
    }
  };
  
  // Get thread item styles based on status and selection
  const getThreadItemStyles = (thread) => {
    const isSelected = thread._id === selectedThreadId;
    const isClosed = thread.status?.toLowerCase() === 'closed';
    
    return {
      container: [
        styles.threadItem,
        isSelected && styles.threadItemActive,
        isClosed && styles.threadItemClosed,
      ],
      title: [
        styles.threadSubject,
        isClosed && styles.threadTextClosed,
      ]
    };
  };
  
  // Get status indicator for a thread
  const renderStatusIndicator = (status) => {
    const statusLower = status?.toLowerCase() || 'open';
    const statusConfig = STATUS_INFO[statusLower] || STATUS_INFO.open;
    
    return (
      <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]}>
        <Ionicons name={statusConfig.iconName} size={12} color="#FFF" />
      </View>
    );
  };
  
  // Render thread item
  const renderThreadItem = ({ item }) => {
    const threadStyles = getThreadItemStyles(item);
    const statusInfo = STATUS_INFO[item.status?.toLowerCase() || 'open'];
    
    return (
      <TouchableOpacity
        style={threadStyles.container}
        onPress={() => handleSelectThread(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.threadHeader}>
          {renderStatusIndicator(item.status)}
          <Text style={threadStyles.title} numberOfLines={1}>
            {item.subject || "Untitled"}
          </Text>
        </View>
        
        <View style={styles.threadFooter}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          <Text style={styles.timestampText}>
            {formatTimestamp(item.lastUpdated)}
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
          
          <Text style={styles.messageText}>{item.content}</Text>
          
          <Text style={styles.messageTimestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };
  
  // Determine if the selected thread is closed
  const selectedThreadClosed = selectedThreadId ? isThreadClosed(selectedThreadId) : false;
  const selectedThread = getSelectedThread();
  
  // Render threads list view
  const renderThreadsView = () => (
    <View style={styles.threadsContainer}>
      <View style={styles.threadListHeader}>
        <Text style={styles.threadListTitle}>Your Conversations</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadThreads}
        >
          <Ionicons name="refresh" size={20} color="#6543CC" />
        </TouchableOpacity>
      </View>
      
      {showCreateForm ? (
        <View style={styles.createThreadForm}>
          <TextInput
            ref={subjectInputRef}
            style={styles.subjectInput}
            placeholder={PLACEHOLDERS.NEW_THREAD}
            placeholderTextColor="#9DA8B9"
            value={newThreadSubject}
            onChangeText={setNewThreadSubject}
            maxLength={100}
            autoFocus={true}
          />
          
          <View style={styles.createThreadActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateForm(false);
                setNewThreadSubject('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.createButton,
                !newThreadSubject.trim() && styles.createButtonDisabled
              ]}
              onPress={handleCreateThread}
              disabled={!newThreadSubject.trim()}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.newThreadButton}
          onPress={() => {
            setShowCreateForm(true);
            setTimeout(() => {
              if (subjectInputRef.current) {
                subjectInputRef.current.focus();
              }
            }, 100);
          }}
        >
          <Ionicons name="add-circle" size={22} color="#FFF" />
          <Text style={styles.newThreadButtonText}>New Conversation</Text>
        </TouchableOpacity>
      )}
      
      {loadingThreads ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={60} color="#6543CC" opacity={0.5} />
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
  );
  
  // Render messages view for selected thread
  const renderMessagesView = () => (
    <View style={styles.messagesContainer}>
      <View style={styles.messagesHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setViewMode('threads')}
        >
          <Ionicons name="arrow-back" size={24} color="#6543CC" />
        </TouchableOpacity>
        
        <View style={styles.threadInfoContainer}>
          {selectedThread && (
            <>
              {renderStatusIndicator(selectedThread.status)}
              <Text style={styles.threadTitle} numberOfLines={1}>
                {selectedThread.subject}
              </Text>
            </>
          )}
        </View>
        
        {selectedThread && !selectedThreadClosed && (
          <TouchableOpacity
            style={styles.closeThreadButton}
            onPress={handleCloseThread}
          >
            <Ionicons name="close-circle-outline" size={22} color="#FF4E4E" />
          </TouchableOpacity>
        )}
      </View>
      
      {loadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#6543CC" opacity={0.5} />
          <Text style={styles.emptyStateTitle}>{EMPTY_STATES.NO_MESSAGES.title}</Text>
          <Text style={styles.emptyStateSubtitle}>{EMPTY_STATES.NO_MESSAGES.subtitle}</Text>
        </View>
      ) : (
        <FlatList
          ref={messageEndRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => `msg-${index}-${item.timestamp}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messageEndRef.current) {
              messageEndRef.current.scrollToEnd({ animated: true });
            }
          }}
        />
      )}
      
      {/* Typing indicator */}
      {adminIsTyping && (
        <View style={styles.typingIndicatorContainer}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotMiddle]} />
              <View style={styles.typingDot} />
            </View>
            <Text style={styles.typingText}>Support team is typing...</Text>
          </View>
        </View>
      )}
      
      {/* Message input or closed notice */}
      {selectedThreadClosed ? (
        <View style={styles.threadClosedNotice}>
          <Ionicons name="lock-closed" size={20} color="#9DA8B9" />
          <Text style={styles.threadClosedText}>
            This conversation is closed. Start a new one if you need more help.
          </Text>
        </View>
      ) : (
        <View style={styles.messageInputContainer}>
          <TextInput
            ref={messageInputRef}
            style={styles.messageInput}
            placeholder={PLACEHOLDERS.MESSAGE_INPUT}
            placeholderTextColor="#9DA8B9"
            value={messageText}
            onChangeText={handleTyping}
            multiline
            maxLength={2000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons 
              name="paper-plane" 
              size={20} 
              color={messageText.trim() ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Support / Ask Anything</Text>
        
        {showInfoBanner && (
          <View style={styles.infoBanner}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={22} color="#6543CC" />
              <Text style={styles.infoText}>{INFO_TEXTS.RESPONSE_TIME}</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoCloseButton}
              onPress={() => setShowInfoBanner(false)}
            >
              <Ionicons name="close" size={20} color="#9DA8B9" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.connectionStatus}>
          <View style={[
            styles.connectionIndicator, 
            connectionStatus === CONNECTION_STATUS.CONNECTED 
              ? styles.connectionIndicatorConnected
              : connectionStatus === CONNECTION_STATUS.DISCONNECTED
                ? styles.connectionIndicatorDisconnected
                : styles.connectionIndicatorError
          ]} />
          <Text style={styles.connectionText}>
            {connectionStatus === CONNECTION_STATUS.CONNECTED
              ? 'Real-time connection active'
              : connectionStatus === CONNECTION_STATUS.DISCONNECTED
                ? 'Connecting to real-time service...'
                : 'Connection error - messages may be delayed'}
          </Text>
        </View>
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
      
      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {viewMode === 'threads' ? renderThreadsView() : renderMessagesView()}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 10,
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
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
  contentContainer: {
    flex: 1,
  },
  
  // Threads View Styles
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
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6543CC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  newThreadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createThreadForm: {
    marginBottom: 15,
  },
  subjectInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  createThreadActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#9DA8B9',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6543CC',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(101, 67, 204, 0.5)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  threadsList: {
    flexGrow: 1,
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
  threadHeader: {
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
  
  // Messages View Styles
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
  threadTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  closeThreadButton: {
    padding: 5,
  },
  messagesList: {
    flexGrow: 1,
    padding: 15,
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
  messageText: {
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
    alignSelf: 'flex-start',
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
    opacity: 0.5,
    marginHorizontal: 2,
  },
  typingDotMiddle: {
    marginTop: -4,
  },
  typingText: {
    color: '#9DA8B9',
    fontSize: 14,
  },
  threadClosedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 168, 185, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    padding: 15,
  },
  threadClosedText: {
    color: '#9DA8B9',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
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
  
  // Loading and Empty States
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
