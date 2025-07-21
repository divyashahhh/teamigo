import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';

export default function MerchScreen() {
  const router = useRouter();
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchMerch();
  }, []);

  const fetchMerch = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) {
      setMerch([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setMerch(data);
    } else {
      setMerch([]);
    }
    setLoading(false);
  };

  const handleLongPress = (id: string) => {
    if (!selectMode) {
      setSelectMode(true);
      setSelectedIds([id]);
    }
  };
  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  const confirmAndDelete = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete Merchandise',
      `Are you sure you want to delete the selected item${selectedIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: handleDelete },
      ]
    );
  };
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      // Fetch merch to get image URLs
      const toDelete = merch.filter(m => selectedIds.includes(m.id));
      // Delete images from storage
      for (const m of toDelete) {
        if (m.image_url) {
          // Extract file name from URL
          const parts = m.image_url.split('/');
          const fileName = parts[parts.length - 1];
          await supabase.storage.from('merch-images').remove([fileName]);
        }
      }
      // Delete from DB
      await supabase.from('merchandise').delete().in('id', selectedIds);
      setSelectedIds([]);
      setSelectMode(false);
      await fetchMerch();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete merchandise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Merchandise</Text>
      {loading ? (
        <ActivityIndicator color="#00b2a9" style={{ marginTop: 40 }} />
      ) : merch.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No merchandise yet.</Text>
        </View>
      ) : (
        <FlatList
          data={merch}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, selectMode && selectedIds.includes(item.id) && { borderColor: '#00b2a9', borderWidth: 2 }]}
              onPress={selectMode ? () => handleSelect(item.id) : undefined}
              onLongPress={() => handleLongPress(item.id)}
              disabled={loading}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}><Text>🛍️</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>${item.price?.toFixed(2) ?? ''}</Text>
              </View>
              {selectMode && (
                <View style={styles.checkboxCircle}>
                  {selectedIds.includes(item.id) && <View style={styles.checkboxInner} />}
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
      <View style={styles.fabRow}>
        {!selectMode ? (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('../merch/setup')}
            activeOpacity={0.8}
          >
            <Text style={styles.fabPlus}>+</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.fab, styles.deleteFab]}
            onPress={confirmAndDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.fabCross}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b2a9',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  price: {
    fontSize: 16,
    color: '#00b2a9',
    marginTop: 4,
  },
  fabRow: {
    position: 'absolute',
    left: 28,
    bottom: 100,
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00b2a9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteFab: {
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
  },
  fabPlus: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: -2,
  },
  fabCross: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: -2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
  },
  checkboxCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00b2a9',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00b2a9',
  },
}); 