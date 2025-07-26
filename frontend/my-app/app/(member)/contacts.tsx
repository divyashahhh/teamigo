import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { streamClient } from '@/utils/streamClient';
import { supabase } from '@/utils/supabaseClient';
import ChatThread from '@/components/ChatThread';
import { StreamChat } from 'stream-chat';
import { Channel as StreamChannel } from 'stream-chat';
import { useRouter } from 'expo-router';

export default function MemberContacts() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Fetch host subscriptions
      const { data: hostSubs, error: hostError } = await supabase
        .from('subscriptions')
        .select('host_id')
        .eq('member_id', user.id);

      let hosts = [];
      if (hostSubs && hostSubs.length > 0) {
        const hostIds = hostSubs.map(row => row.host_id);
        // Fetch host user data
        const { data: hostUsers, error: hostUsersError } = await supabase
          .from('users')
          .select('id, name, user_metadata')
          .in('id', hostIds);
        hosts = hostUsers || [];
      }

      // Fetch other members subscribed to the same hosts
      let coMembers: any[] = [];
      if (hostSubs && hostSubs.length > 0) {
        const hostIds = hostSubs.map(row => row.host_id);
        const { data: memberSubs, error: memberError } = await supabase
          .from('subscriptions')
          .select('member_id')
          .in('host_id', hostIds)
          .neq('member_id', user.id);
        if (!memberError && memberSubs) {
          const memberIds = memberSubs.map(row => row.member_id);
          // Fetch member user data
          const { data: memberUsers, error: memberUsersError } = await supabase
            .from('users')
            .select('id, name, user_metadata')
            .in('id', memberIds);
          coMembers = memberUsers || [];
        }
      }
      setContacts([...hosts, ...coMembers]);
      console.log('hostSubs:', hostSubs);
      console.log('hosts:', hosts);
      console.log('coMembers:', coMembers);
      console.log('contacts:', [...hosts, ...coMembers]);
      setLoading(false);
    };
    fetchContacts();
    return () => { streamClient.disconnectUser(); };
  }, []);

  const startOneToOneChat = async (contactId: string) => {
    if (!user) return;
    const channel = streamClient.channel('messaging', {
      members: [user.id, contactId],
    });
    await channel.watch();
    setSelectedChannel(channel as StreamChannel);
  };

  if (loading || !user) return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  if (!user) return null;

  if (contacts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 20, color: '#888', fontSize: 16 }}>No contacts yet.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/chats2')}>
          <Text style={styles.emptyBtnText}>Go to Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/profile')}>
          <Text style={styles.emptyBtnText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedChannel) {
    return <ChatThread channel={selectedChannel} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.contactCard} onPress={() => startOneToOneChat(item.id)}>
            <Text style={styles.name}>{item.user_metadata?.name || 'User'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No contacts yet.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', margin: 20 },
  contactCard: { padding: 16, backgroundColor: '#f2f2f2', borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  emptyBtn: {
    backgroundColor: '#00b2a9',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  emptyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 