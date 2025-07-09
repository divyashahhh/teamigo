import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { supabase } from '@/utils/supabaseClient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChatsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserAndChats = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace('/auth/login');
        return;
      }
      setUserId(user.id);
      fetchChats(user.id);
    };
    getUserAndChats();
  }, []);

  const fetchChats = async (uid: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participant_ids', [uid]);
    if (error) {
      console.error('Fetch Chats Error:', error.message);
    } else {
      setChats(data || []);
    }
  };

  const createChatWithUser = async () => {
    if (!searchEmail.trim() || !userId) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    setLoading(true);
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', searchEmail.trim())
      .single();
    if (userError || !targetUser) {
      Alert.alert('User Not Found', 'No user with this email');
      setLoading(false);
      return;
    }
    if (targetUser.id === userId) {
      Alert.alert('Error', 'Cannot chat with yourself');
      setLoading(false);
      return;
    }
    const { error: chatError } = await supabase
      .from('chats')
      .insert({
        participant_ids: [userId, targetUser.id],
      });
    if (chatError) {
      console.error('Create Chat Error:', chatError.message);
      Alert.alert('Error', 'Failed to create chat');
    } else {
      Alert.alert('Success', 'Chat created');
      fetchChats(userId);
    }
    setLoading(false);
    setSearchEmail('');
  };

  const renderChat = ({ item }: { item: any }) => (
    <Pressable
      style={styles.chatItem}
      onPress={() => router.push(`/chats/${item.id}` as any)}
    >
      <Text style={styles.chatText}>
        Chat ID: {item.id}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable onPress={() => router.replace('/(member)/(tabs)/profile')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="#FFD700" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>My Chats</Text>
      <TextInput
        placeholder="Enter user email to chat"
        value={searchEmail}
        onChangeText={setSearchEmail}
        style={styles.input}
      />
      <Pressable onPress={createChatWithUser} style={styles.addButton}>
        <Text style={styles.addText}>{loading ? 'Creating...' : 'Start Chat'}</Text>
      </Pressable>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#002233',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
  },
  backText: {
    color: '#FFD700',
    fontSize: 18,
    marginLeft: 6,
    fontWeight: '600',
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#10364A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#00AFAF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
  chatItem: {
    backgroundColor: '#092A3D',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  chatText: {
    color: '#FFFFFF',
  },
}); 