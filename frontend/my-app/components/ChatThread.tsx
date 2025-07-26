import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chat, Channel, MessageList, MessageInput, OverlayProvider } from 'stream-chat-expo';
import { streamClient } from '@/utils/streamClient';
import { Channel as StreamChannel } from 'stream-chat';

export default function ChatThread({ channel }: { channel: StreamChannel | null }) {
  if (!channel) return null;
  return (
    <OverlayProvider>
      <Chat client={streamClient}>
        <Channel channel={channel}>
          <View style={styles.container}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </OverlayProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
}); 