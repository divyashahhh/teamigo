import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Image, ActivityIndicator, KeyboardAvoidingView, Pressable, Dimensions, Alert
} from 'react-native';
import { supabase } from '@/utils/supabaseClient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function HostAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    // Fetch announcements for this host
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    setImageUploading(true);
    try {
      if (!userId) return null;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `announcement-${userId}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('announcement-images')
        .upload(fileName, blob);
      if (uploadError) {
        Alert.alert('Upload error', uploadError.message);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from('announcement-images')
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      setSubmitting(false);
      return;
    }
    // 1. Insert announcement row without image_url
    const { data: insertData, error: insertError } = await supabase
      .from('announcements')
      .insert({
        host_id: user.id,
        title: title.trim(),
        description: description.trim(),
        // image_url: null for now
      })
      .select()
      .single();
    if (insertError) {
      Alert.alert('Error', insertError.message);
      setSubmitting(false);
      return;
    }
    const announcementId = insertData.id;
    // 2. Upload the image (if any)
    let imageUrl = null;
    if (image) {
      const response = await fetch(image);
      const blob = await response.blob();
      const fileName = `${announcementId}/image.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('announcement-images')
        .upload(fileName, blob, { upsert: true });
      if (uploadError) {
        Alert.alert('Upload error', uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('announcement-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    // 3. Update the announcement row with the image URL
    if (imageUrl) {
      await supabase
        .from('announcements')
        .update({ image_url: imageUrl })
        .eq('id', announcementId);
    }
    setShowModal(false);
    setTitle('');
    setDescription('');
    setImage(null);
    await fetchAnnouncements();
    setSubmitting(false);
  };

  const handleSelectAnnouncement = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteAnnouncements = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      // Fetch announcements to get image URLs
      const toDelete = announcements.filter(a => selectedIds.includes(a.id));
      // Delete images from storage
      for (const a of toDelete) {
        if (a.image_url) {
          // Extract file name from URL
          const parts = a.image_url.split('/');
          const fileName = parts[parts.length - 1];
          await supabase.storage.from('announcement-images').remove([fileName]);
        }
      }
      // Delete from DB
      await supabase.from('announcements').delete().in('id', selectedIds);
      setSelectedIds([]);
      setSelectMode(false);
      await fetchAnnouncements();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete announcements');
    } finally {
      setLoading(false);
    }
  };

  const renderAnnouncement = (a: any) => (
    <Pressable
      key={a.id}
      style={[styles.card, selectMode && selectedIds.includes(a.id) && { borderColor: '#00b2a9', borderWidth: 2 }]}
      onPress={selectMode ? () => handleSelectAnnouncement(a.id) : undefined}
      disabled={!selectMode}
    >
      {a.image_url ? (
        <Image source={{ uri: a.image_url }} style={styles.announcementImage} resizeMode="cover" />
      ) : null}
      <Text style={styles.cardTitle}>{a.title}</Text>
      <Text style={styles.cardBody}>{a.description}</Text>
      <Text style={styles.cardDate}>{new Date(a.created_at).toLocaleString()}</Text>
      {selectMode && (
        <View style={styles.checkboxCircle}>
          {selectedIds.includes(a.id) && <View style={styles.checkboxInner} />}
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.mainContainer}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator color="#00b2a9" style={{ marginTop: 40 }} />
        ) : announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No announcements yet.</Text>
          </View>
        ) : (
          announcements.map(renderAnnouncement)
        )}
      </ScrollView>
      {/* Floating Plus & Trash Buttons */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabPlus}>+</Text>
        </TouchableOpacity>
          <TouchableOpacity
          style={[styles.fab, styles.deleteFab]}
          onPress={() => {
            if (selectMode) {
              handleDeleteAnnouncements();
            } else {
              setSelectMode(true);
            }
          }}
          activeOpacity={0.8}
          >
          <Text style={styles.fabCross}>×</Text>
          </TouchableOpacity>
      </View>
      {/* Modal for New Announcement */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCenterWrap}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              {/* Image Picker */}
              <Pressable style={styles.circularFrame} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.profileImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.addImageText}>+</Text>
                )}
                {imageUploading && <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center', top: 40 }} color="#00b2a9" />}
              </Pressable>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#888"
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor="#888"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    setTitle('');
                    setDescription('');
                    setImage(null);
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.saveButton, submitting && styles.saveButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.saveButtonText}>{submitting ? 'Posting...' : 'Post'}</Text>
                </Pressable>
              </View>
            </View>
      </View>
        </KeyboardAvoidingView>
      </Modal>
        </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 20,
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
  fabRow: {
    position: 'absolute',
    right: 28,
    bottom: 40,
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
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  announcementImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  cardBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    minWidth: 300,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 18,
    textAlign: 'left',
  },
  circularFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  addImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00b2a9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 90,
    backgroundColor: '#e0e0e0',
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00b2a9',
  },
  saveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});