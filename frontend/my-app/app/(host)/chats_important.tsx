import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { streamClient } from '@/utils/streamClient';
import { supabase } from '@/utils/supabaseClient';
import ChatThread from '@/components/ChatThread';
import { Channel as StreamChannel } from 'stream-chat';

export default function HostImportantChats() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchSubscribers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Fetch subscribers from Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .select('member_id, members:member_id(*, user_metadata)')
        .eq('host_id', user.id);
      if (!error && data) {
        setSubscribers(data.map(row => row.members));
      }
      setLoading(false);
    };
    fetchSubscribers();
    return () => { streamClient.disconnectUser(); };
  }, []);

  const startOneToOneChat = async (memberId: string) => {
    if (!user) return;
    const channel = streamClient.channel('messaging', {
      members: [user.id, memberId],
    });
    await channel.watch();
    setSelectedChannel(channel as StreamChannel);
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds([]);
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openGroupModal = () => {
    setGroupModalVisible(true);
  };

  const closeGroupModal = () => {
    setGroupModalVisible(false);
    setGroupName('');
  };

  const createGroupChat = async () => {
    if (!user || selectedIds.length < 2 || !groupName.trim()) return;
    const members = [user.id, ...selectedIds];
    // Explicitly type the custom data to allow 'name'
    const channel = streamClient.channel('messaging', undefined, {
      name: groupName.trim() as any, // Suppress TS error for 'name' property
      members,
    } as any);
    await channel.watch();
    setSelectedChannel(channel as StreamChannel);
    setSelectMode(false);
    setSelectedIds([]);
    closeGroupModal();
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  if (!user) return null;

  if (selectedChannel) {
    return <ChatThread channel={selectedChannel} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Subscribers</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleSelectMode}>
          <Text style={styles.actionBtnText}>{selectMode ? 'Cancel' : 'Select Multiple'}</Text>
        </TouchableOpacity>
        {selectMode && selectedIds.length >= 2 && (
          <TouchableOpacity style={[styles.actionBtn, styles.createGroupBtn]} onPress={openGroupModal}>
            <Text style={styles.actionBtnText}>Create Group Chat</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={subscribers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.subscriberCard, selectMode && selectedIds.includes(item.id) && { borderColor: '#00b2a9', borderWidth: 2 }]}
            onPress={selectMode ? () => handleSelect(item.id) : () => startOneToOneChat(item.id)}
            onLongPress={!selectMode ? () => { setSelectMode(true); setSelectedIds([item.id]); } : undefined}
            disabled={loading}
          >
            <Text style={styles.name}>{item.user_metadata?.name || 'Member'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No subscribers yet.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
      <Modal visible={groupModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Group Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={closeGroupModal} style={styles.modalBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={createGroupChat} style={[styles.modalBtn, { marginLeft: 12 }]}><Text>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', margin: 20 },
  subscriberCard: { padding: 16, backgroundColor: '#f2f2f2', borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10 },
  actionBtn: { backgroundColor: '#e0e0e0', padding: 10, borderRadius: 8, marginRight: 10 },
  actionBtnText: { fontWeight: 'bold' },
  createGroupBtn: { backgroundColor: '#00b2a9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  modalBtn: { padding: 10 },
}); 