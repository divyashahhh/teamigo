import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

interface Purchase {
  id: string;
  user: { id: string; name?: string; user_metadata?: any } | null;
  answers: Record<string, string>;
  quantity: number;
  created_at: string;
}

export default function MerchScreen() {
  const router = useRouter();
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMerch, setSelectedMerch] = useState<any | null>(null); // Use your merch type if available
  const [popupVisible, setPopupVisible] = useState(false);
  const [purchaseData, setPurchaseData] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

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

  const handleMerchPress = async (merchItem: any) => { // Replace 'any' with your merch type if available
    setSelectedMerch(merchItem);
    setPopupVisible(true);
    setLoadingPurchases(true);
    // Fetch purchases for this merch
    const { data, error } = await supabase
      .from('purchases')
      .select('*, user:users!purchases_user_id_fkey(id, name, profile_image_url)')
      .eq('merch_id', merchItem.id)
      .order('created_at', { ascending: false });
    
    console.log('Purchases query result:', { data, error });
    console.log('Merch ID being queried:', merchItem.id);
    
    setPurchaseData(data || []);
    setLoadingPurchases(false);
  };

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgmcfhlkc/image/upload';
  const CLOUDINARY_PRESET = 'user_uploads';
  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const data = new FormData();
    data.append('file', `data:image/jpeg;base64,${base64}`);
    data.append('upload_preset', CLOUDINARY_PRESET);
    data.append('folder', 'merch_images');
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data });
    const result = await res.json();
    if (result.secure_url) { return result.secure_url; } else { throw new Error('Cloudinary upload failed'); }
  };

  return (
    <LinearGradient colors={['#EAF0FF', '#FFF6E0', '#C6FFF6']} style={{ flex: 1 }}>
      {/* Done button in select mode, at absolute top right of the screen */}
      {selectMode && (
        <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'box-none' }]}>
          <View style={styles.doneButtonScreenEdge}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setSelectMode(false);
                setSelectedIds([]);
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
                style={[styles.card, { flexDirection: 'row' }, selectMode && selectedIds.includes(item.id) && { borderColor: '#00b2a9', borderWidth: 2 }]}
                onPress={selectMode ? () => handleSelect(item.id) : () => handleMerchPress(item)}
                onLongPress={() => handleLongPress(item.id)}
                disabled={loading}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      marginRight: 16,
                      backgroundColor: '#eee',
                    }}
                    resizeMode="cover"
                  />
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
      {/* Purchases Popup Modal */}
      <Modal visible={popupVisible} animationType="slide" transparent onRequestClose={() => setPopupVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '90%', alignItems: 'stretch' }]}> 
            <Text style={styles.modalTitle}>Purchases for: {selectedMerch?.title}</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {loadingPurchases ? (
                <ActivityIndicator color="#00b2a9" />
              ) : purchaseData.length === 0 ? (
                <Text style={styles.empty}>No purchases yet.</Text>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={styles.tableHeaderCell}>Buyer</Text>
                    <Text style={styles.tableHeaderCell}>Answers</Text>
                    <Text style={styles.tableHeaderCell}>Qty</Text>
                    <Text style={styles.tableHeaderCell}>Time</Text>
                  </View>
                  {purchaseData.map((purchase, idx) => (
                    <View key={purchase.id || idx} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{purchase.user?.name || purchase.user?.id || 'Unknown'}</Text>
                      <View style={[styles.tableCell, { alignItems: 'flex-start' }]}> 
                        {Object.entries(purchase.answers || {}).map(([q, a], i) => (
                          <Text key={i} style={styles.answerText}>{q}: {a}</Text>
                        ))}
                      </View>
                      <Text style={styles.tableCell}>{purchase.quantity}</Text>
                      <Text style={styles.tableCell}>{new Date(purchase.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setPopupVisible(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Make the main content transparent
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C2A67', // Dark text on light background
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white overlay
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
    color: '#1C2A67', // Dark text on light background
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
  doneButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 100,
  },
  doneButton: {
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
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  doneButtonScreenEdge: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 200,
    alignItems: 'flex-end',
    width: '100%',
    pointerEvents: 'box-none',
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
    // alignItems: 'center', // Remove this to allow full width
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#1C2A67',
    textAlign: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 6,
    marginBottom: 6,
    backgroundColor: '#f7f7f7',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1C2A67',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  answerText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'left',
    lineHeight: 18,
  },
  closeModalButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  closeModalText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
}); 