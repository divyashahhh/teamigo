import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

const BACKEND_URL = 'http://192.168.1.116:5002';

interface Chat {
  id: number;
  participants: User[];
  last_message: Message | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  last_seen: string | null;
}

interface Message {
  id: number;
  content: string;
  sender: User;
  created_at: string;
  is_read: boolean;
}

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    loadUserAndChats();
  }, []);

  const loadUserAndChats = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        setIsLoading(false);
        router.replace('/login');
        return;
      }
  
      const numericUserId = parseInt(storedUserId, 10);
      if (isNaN(numericUserId) || numericUserId <= 0) {
        console.warn('Invalid stored user ID:', storedUserId);
        setIsLoading(false);
        router.replace('/login');
        return;
      }
  
      setCurrentUserId(numericUserId);
      fetchChats(numericUserId);
    } catch (err) {
      console.error('Error loading user:', err);
      setIsLoading(false);
    }
  };

  const fetchChats = async (userId: number) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/chats?user_id=${userId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      Alert.alert('Error', 'Failed to load chats. Please check your connection.');
      setChats([]); 
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  const searchUserByEmail = async () => {
    if (!userEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setIsCreatingChat(true);
      const response = await axios.get(`${BACKEND_URL}/users/search?q=${userEmail.trim()}`);
      const users = response.data;
      
      if (users.length === 0) {
        Alert.alert('Not Found', 'No user found with this email address');
        return;
      }

      const matchingUser = users.find((user: { email: string; }) => user.email.toLowerCase() === userEmail.toLowerCase());
      if (!matchingUser) {
        Alert.alert('Not Found', 'No user found with this email address');
        return;
      }

      if (matchingUser.id === currentUserId) {
        Alert.alert('Error', 'You cannot start a chat with yourself');
        return;
      }

  
      const chatResponse = await axios.post(`${BACKEND_URL}/chats`, {
        user_ids: [currentUserId, matchingUser.id]
      });

      setNewChatModalVisible(false);
      setUserEmail('');
      
      
      router.push({
        pathname: '/chats',
        params: { id: chatResponse.data.id }
      });

    } catch (err) {
      console.error('Error creating chat:', err);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (currentUserId) {
      fetchChats(currentUserId);
    }
  };

  const getChatName = (chat: Chat) => {
    if (!currentUserId) return '';
    const otherParticipants = chat.participants.filter(p => p.id !== currentUserId);
    return otherParticipants.map(p => p.name).join(', ');
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => router.push({
        pathname: '/chats',
        params: { id: item.id }
      })}
    >
      <View style={styles.avatarContainer}>
        {item.participants[0].avatar ? (
          <Image source={{ uri: item.participants[0].avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.avatarText}>
              {getChatName(item).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {getChatName(item)}
          </Text>
          {item.last_message && (
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(item.last_message.created_at), { addSuffix: true })}
            </Text>
          )}
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message ? item.last_message.content : 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={() => setNewChatModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : (
        <>
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No active chats</Text>
                <TouchableOpacity
                  style={styles.newChatButton}
                  onPress={() => setNewChatModalVisible(true)}
                >
                  <Text style={styles.newChatButtonText}>Start a New Chat</Text>
                </TouchableOpacity>
              </View>
            }
          />

          <Modal
            visible={newChatModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Chat</Text>
                <Text style={styles.modalSubtitle}>Enter user's email address</Text>
                
                <TextInput
                  style={styles.emailInput}
                  value={userEmail}
                  onChangeText={setUserEmail}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setNewChatModalVisible(false);
                      setUserEmail('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.createButton,
                      isCreatingChat && styles.disabledButton
                    ]}
                    onPress={searchUserByEmail}
                    disabled={isCreatingChat}
                  >
                    {isCreatingChat ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.createButtonText}>Create Chat</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002233'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
    backgroundColor: '#002233'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#002233'
  },
  emptyText: {
    fontSize: 16,
    color: '#B0BEC5',
    marginBottom: 20,
    textAlign: 'center'
  },
  newChatButton: {
    backgroundColor: '#00AFAF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#445E6B',
    backgroundColor: '#092A3D',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 14
  },
  avatarContainer: {
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  placeholderAvatar: {
    backgroundColor: '#00AFAF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    color: '#FFFFFF'
  },
  timestamp: {
    fontSize: 14,
    color: '#B0BEC5',
    marginLeft: 8
  },
  lastMessage: {
    fontSize: 15,
    color: '#B0BEC5'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 34, 51, 0.9)'
  },
  modalContent: {
    backgroundColor: '#092A3D',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF'
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    marginBottom: 20,
    textAlign: 'center'
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#445E6B',
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#10364A',
    color: '#FFFFFF'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#10364A',
    borderWidth: 1,
    borderColor: '#445E6B'
  },
  createButton: {
    backgroundColor: '#00AFAF',
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7
  },
  cancelButtonText: {
    color: '#B0BEC5',
    fontSize: 16,
    fontWeight: '600'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});