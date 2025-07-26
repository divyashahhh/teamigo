import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Chat, ChannelList, OverlayProvider } from 'stream-chat-expo';
import { streamClient } from '@/utils/streamClient';
import { supabase } from '@/utils/supabaseClient';
import ChatThread from '@/components/ChatThread';
import { Channel as StreamChannel } from 'stream-chat';

export default function HostGeneralChats() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    const connect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        try {
          const response = await fetch('https://stream-token-server.vercel.app/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              name: user.user_metadata?.name || 'Host',
              image: user.user_metadata?.avatar_url || undefined,
            }),
          });
          const { token } = await response.json();
          await streamClient.connectUser(
            {
              id: user.id,
              name: user.user_metadata?.name || 'Host',
              image: user.user_metadata?.avatar_url || undefined,
            },
            token
          );
          console.log('StreamChat: connectUser success for', user.id);
        } catch (err) {
          console.error('StreamChat: connectUser error:', err);
        }
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

  // Filter: Only show 1-1 chats with non-subscribers (to be implemented)
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
}); 