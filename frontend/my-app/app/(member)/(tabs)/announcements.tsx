import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';
import { useMemberFeed } from '@/hooks/useMemberFeed';
import { supabase } from '@/utils/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

export default function MemberAnnouncements() {
  const { hostIds, loading: subsLoading, error: subsError } = useMemberSubscriptions();
  const { data: announcements, loading, error } = useMemberFeed('announcements', hostIds);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orgs, setOrgs] = useState<{ id: string, name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  useEffect(() => {
    if (hostIds.length > 0) {
      supabase
        .from('users')
        .select('id, name')
        .in('id', hostIds)
        .then(({ data }) => {
          setOrgs(data || []);
        });
    } else {
      setOrgs([]);
    }
  }, [hostIds]);

  const filteredAnnouncements = selectedOrg
    ? announcements.filter((a: any) => a.host_id === selectedOrg)
    : announcements;

  if (subsLoading || loading) {
    return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  }
  if (subsError || error) {
    return <View style={styles.center}><Text style={styles.error}>{subsError || error}</Text></View>;
  }
  return (
    <LinearGradient colors={['#EAF0FF', '#FFF6E0', '#C6FFF6']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: '#222B45' }]} onPress={() => setFilterModalVisible(true)}>
          <Text style={[styles.filterButtonText, { color: '#fff' }]}>Filter</Text>
        </TouchableOpacity>
        {selectedOrg && (
          <View style={[styles.selectedOrgBar, { backgroundColor: 'rgba(255,255,255,0.7)' }] }>
            <Text style={[styles.selectedOrgText, { color: '#222B45' }] }>
              Showing: {orgs.find(o => o.id === selectedOrg)?.name || 'Organisation'}
            </Text>
            <Pressable onPress={() => setSelectedOrg(null)}>
              <Text style={[styles.clearFilterText, { color: '#FF4444' }]}>Clear Filter</Text>
            </Pressable>
          </View>
        )}
        <FlatList
  data={filteredAnnouncements}
  keyExtractor={item => item.id}
  contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
  renderItem={({ item }) => (
    <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center' }]}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            marginRight: 16,
            backgroundColor: '#eee',
          }}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text>📣</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: '#222B45' }]}>{item.title}</Text>
        <Text style={[styles.desc, { color: '#6B7280' }]}>{item.description}</Text>
        <Text style={[styles.date, { color: '#888' }]}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </View>
  )}
  ListEmptyComponent={<Text style={[styles.empty, { color: '#888' }]}>No announcements from your subscriptions yet.</Text>}
/>
        <Modal visible={filterModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: 'rgba(255,255,255,0.98)' }] }>
              <Text style={[styles.modalTitle, { color: '#222B45' }]}>Filter by Organisation</Text>
              {orgs.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.orgOption, selectedOrg === org.id && styles.selectedOrgOption, { backgroundColor: selectedOrg === org.id ? '#EAF0FF' : 'rgba(0,0,0,0.03)' }]}
                  onPress={() => {
                    setSelectedOrg(org.id);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.orgName, { color: '#222B45' }]}>{org.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setFilterModalVisible(false)}>
                <Text style={[styles.closeModalText, { color: '#FF4444' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff4444', fontSize: 16 },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#222' },
  desc: { fontSize: 16, color: '#444', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 8 },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
  filterButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    backgroundColor: '#00b2a9',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedOrgBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f7f6',
    paddingVertical: 8,
    marginTop: 48,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 20,
    gap: 12,
  },
  selectedOrgText: {
    color: '#1AB09E',
    fontWeight: '600',
    fontSize: 15,
  },
  clearFilterText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#1C2A67',
  },
  orgOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  selectedOrgOption: {
    backgroundColor: '#1AB09E',
  },
  orgName: {
    fontSize: 16,
    color: '#1C2A67',
    fontWeight: '600',
  },
  closeModalButton: {
    marginTop: 16,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  closeModalText: {
    color: '#333',
    fontSize: 16,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});