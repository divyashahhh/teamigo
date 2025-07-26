import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Chat, ChannelList, OverlayProvider } from 'stream-chat-expo';
import { streamClient } from '@/utils/streamClient';
import { supabase } from '@/utils/supabaseClient';
import ChatThread from '@/components/ChatThread';
import { Channel as StreamChannel } from 'stream-chat';
import { useRouter } from 'expo-router';

export default function MemberChats2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [channels, setChannels] = useState<StreamChannel[]>([]);

  useEffect(() => {
    const connect = async () => {
      console.log('StreamChat: Starting connectUser');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        try {
          const response = await fetch('https://stream-token-server.vercel.app/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              name: user.user_metadata?.name || 'Member',
              image: user.user_metadata?.avatar_url || undefined,
            }),
          });
          const { token } = await response.json();
          await streamClient.connectUser(
            {
              id: user.id,
              name: user.user_metadata?.name || 'Member',
              image: user.user_metadata?.avatar_url || undefined,
            },
            token
          );
          console.log('StreamChat: connectUser success for', user.id);
        } catch (err) {
          console.error('StreamChat: connectUser error:', err);
        }
        // Fetch channels
        try {
          const filters = { type: 'messaging', members: { $in: [user.id] } };
          const sort = [{ last_message_at: -1 }];
          const result = await streamClient.queryChannels(filters, sort, {});
          setChannels(result as StreamChannel[]);
          console.log('StreamChat: queryChannels result:', result);
        } catch (err) {
          console.error('StreamChat: queryChannels error:', err);
        }
      } else {
        console.error('StreamChat: No user found from supabase.auth.getUser', userError);
      }
      setLoading(false);
    };
    connect();
    return () => { streamClient.disconnectUser(); };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;

  if (selectedChannel) {
    return <ChatThread channel={selectedChannel} />;
  }

  if (channels.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 20, color: '#888', fontSize: 16 }}>No chats yet.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/contacts')}>
          <Text style={styles.emptyBtnText}>Go to Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/profile')}>
          <Text style={styles.emptyBtnText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <OverlayProvider>
      <Chat client={streamClient}>
        <ChannelList
          filters={{ type: 'messaging', members: { $in: [user.id] } }}
          onSelect={(channel) => setSelectedChannel(channel as StreamChannel)}
        />
      </Chat>
    </OverlayProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBtn: {
    backgroundColor: '#00b2a9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 