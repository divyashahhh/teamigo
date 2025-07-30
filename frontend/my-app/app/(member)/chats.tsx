import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatService } from '../../services/chatService';
import { ChatConversation } from '../../types/chat';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function MemberChats() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const userConversations = await chatService.getUserConversations();
      // Filter out conversations with no messages
      const conversationsWithMessages = userConversations.filter(conv => conv.last_message);
      setConversations(conversationsWithMessages);
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversation: ChatConversation) => {
    router.push({
      pathname: '/(member)/chat_thread' as any,
      params: { conversationId: conversation.id }
    });
  };

  const handleBackPress = () => {
    if (from === 'profile') {
      router.push('/(member)/(tabs)/profile' as any);
    } else if (from === 'portal') {
      router.back();
    } else {
      // Default fallback
      router.push('/(member)/(tabs)/maps' as any);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const otherUser = item.other_user;
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: borderColor }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {otherUser.profile_image_url ? (
            <Image source={{ uri: otherUser.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#ddd' }]}>
              <Text style={styles.avatarText}>
                {otherUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
              {otherUser.name}
            </Text>
            <Text style={[styles.timeText, { color: textColor }]}>
              {item.last_message ? formatTime(item.last_message.created_at) : ''}
            </Text>
          </View>
          
          <View style={styles.conversationFooter}>
            <Text style={[styles.lastMessage, { color: textColor }]} numberOfLines={1}>
              {item.last_message?.content || 'No messages yet'}
      </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
  );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Text style={[styles.backButtonText, { color: textColor }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Chats</Text>
        <View style={styles.headerSpacer} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptySubtext, { color: textColor }]}>
            Start chatting with hosts from their portal pages
          </Text>
        </View>
      ) : (
      <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 60,
  },
  listContainer: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 