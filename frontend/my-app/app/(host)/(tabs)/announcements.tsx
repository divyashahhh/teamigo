import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Image, ActivityIndicator, KeyboardAvoidingView, Pressable, Dimensions, Alert
} from 'react-native';
import { supabase } from '@/utils/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

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
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) {
      console.log('No user found, setting empty announcements');
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    console.log('Fetching announcements for user:', user.id);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('Announcements fetch result:', { data, error });
    
    if (!error && data) {
      console.log('Setting announcements:', data);
      setAnnouncements(data);
    } else if (error) {
      console.error('Error fetching announcements:', error);
    }
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

  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const data = new FormData();
    data.append('file', `data:image/jpeg;base64,${base64}`);
    data.append('upload_preset', 'user_uploads');
    data.append('folder', 'announcement_images');
    const res = await fetch('https://api.cloudinary.com/v1_1/dgmcfhlkc/image/upload', { method: 'POST', body: data });
    const result = await res.json();
    if (result.secure_url) { return result.secure_url; } else { throw new Error('Cloudinary upload failed'); }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      setSubmitting(false);
      return;
    }
    console.log('Submitting announcement for user:', user.id);
    console.log('Announcement data:', { title: title.trim(), description: description.trim() });
    
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadToCloudinary(image);
    }
    const { data: insertData, error: insertError } = await supabase
      .from('announcements')
      .insert({
        host_id: user.id,
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl,
      })
      .select()
      .single();
    
    console.log('Insert result:', { insertData, insertError });
    
    if (insertError) {
      console.error('Error inserting announcement:', insertError);
      Alert.alert('Error', insertError.message);
      setSubmitting(false);
      return;
    }
    const announcementId = insertData.id;
    console.log('Announcement inserted with ID:', announcementId);
    
    if (imageUrl) {
      console.log('Updating announcement with image URL:', imageUrl);
      const { error: updateError } = await supabase
        .from('announcements')
        .update({ image_url: imageUrl })
        .eq('id', announcementId);
      
      if (updateError) {
        console.error('Error updating announcement with image:', updateError);
      }
    }
    
    console.log('Announcement creation completed, refreshing list...');
    setShowModal(false);
    setTitle('');
    setDescription('');
    setImage(null);
    await fetchAnnouncements();
    setSubmitting(false);
    console.log('Announcement submission process completed');
  };

  const handleSelectAnnouncement = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleLongPressAnnouncement = (id: string) => {
    if (!selectMode) {
      setSelectMode(true);
      setSelectedIds([id]);
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
          await supabase.storage.from('announcement-images-new').remove([fileName]);
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

  const confirmAndDeleteAnnouncements = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete Announcements',
      `Are you sure you want to delete the selected announcement${selectedIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: handleDeleteAnnouncements },
      ]
    );
  };

  const renderAnnouncement = (a: any) => (
    <Pressable
      key={a.id}
      style={[styles.card, { flexDirection: 'row' }, selectMode && selectedIds.includes(a.id) && { borderColor: '#00b2a9', borderWidth: 2 }]}
      onPress={selectMode ? () => handleSelectAnnouncement(a.id) : undefined}
      onLongPress={() => handleLongPressAnnouncement(a.id)}
      disabled={loading}
    >
      {a.image_url ? (
        <Image
          source={{ uri: a.image_url }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
            marginRight: 16,
            backgroundColor: '#eee',
          }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{a.title}</Text>
        <Text style={styles.cardBody}>{a.description}</Text>
        <Text style={styles.cardDate}>{new Date(a.created_at).toLocaleString()}</Text>
      </View>
      {selectMode && (
        <View style={styles.checkboxCircle}>
          {selectedIds.includes(a.id) && <View style={styles.checkboxInner} />}
        </View>
      )}
    </Pressable>
  );

  return (
    <LinearGradient colors={['#EAF0FF', '#FFF6E0', '#C6FFF6']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Done button in select mode, at absolute top right of the screen, overlaying header */}
        {selectMode && (
          <TouchableOpacity
            style={styles.doneButtonScreenEdge}
            onPress={() => {
              setSelectMode(false);
              setSelectedIds([]);
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}
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
            {!selectMode ? (
              <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.fabPlus}>+</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.fab, styles.deleteFab]}
                onPress={confirmAndDeleteAnnouncements}
                activeOpacity={0.8}
              >
                <Text style={styles.fabCross}>×</Text>
              </TouchableOpacity>
            )}
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Make the main content transparent
  },
  container: {
    backgroundColor: 'transparent', // Make the ScrollView transparent
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white overlay
    borderRadius: 20,
    padding: 20,
  },
  emptyText: {
    color: '#333', // Dark text for contrast
    fontSize: 18,
    fontWeight: '500',
  },
  fabRow: {
    position: 'absolute',
    right: 28,
    bottom: 100, // moved up from 40
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
    color: '#fff', // White text on dark button
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: -2,
  },
  fabCross: {
    color: '#fff', // White text on dark button
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white overlay
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
    color: '#333', // Dark text for contrast
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
    color: '#333', // Dark text for contrast
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
    color: '#fff', // White text on dark button
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
    color: '#fff', // White text on dark button
    fontWeight: '600',
    fontSize: 16,
  },
  doneButtonScreenEdge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 9999,
    backgroundColor: '#00b2a9',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff', // White text on dark button
    fontWeight: 'bold',
    fontSize: 16,
  },
});