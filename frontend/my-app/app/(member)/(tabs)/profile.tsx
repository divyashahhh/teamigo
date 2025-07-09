import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform,
  TextInput, Image, Modal, KeyboardAvoidingView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Name');
  const [description, setDescription] = useState('Description');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not fetch user data');
        return;
      }
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) {
        Alert.alert('Error', 'Could not fetch profile data');
        return;
      }
      setName(profileData.name || 'Name');
      setDescription(profileData.description || 'Description');
      setProfileImageUrl(profileData.profile_image_url);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', 'Failed to logout properly');
        return;
      }
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const pickImage = async () => {
    try {
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
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob);
      if (uploadError) {
        Alert.alert('Error', 'Failed to upload image');
        return;
      }
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      setProfileImageUrl(urlData.publicUrl);
      await supabase
        .from('users')
        .update({ 
          profile_image_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      Alert.alert('Success', 'Profile image updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!tempName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }
      await supabase
        .from('users')
        .update({ 
          name: tempName.trim(),
          description: tempDescription.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      setName(tempName.trim());
      setDescription(tempDescription.trim());
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setTempName(name);
    setTempDescription(description);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b2a9" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Header with Chats button */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
        <Pressable onPress={() => router.push('/chats')} style={{ padding: 8 }}>
          <Image source={require('@/assets/icons/chat.png')} style={{ width: 28, height: 28, tintColor: '#00b2a9' }} />
        </Pressable>
      </View>
      <View style={styles.container}>
        {/* Profile Image */}
        <Pressable style={styles.circularFrame} onPress={pickImage}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <Text style={styles.addImageText}>+</Text>
          )}
        </Pressable>
        {/* Name */}
        <Text style={styles.namePlaceholder}>{name}</Text>
        {/* Description */}
        <Text style={styles.descriptionPlaceholder} numberOfLines={3} ellipsizeMode="tail">{description}</Text>
        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          <Pressable style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </View>
      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCenterWrap}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                placeholderTextColor="#888"
                returnKeyType="next"
              />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={tempDescription}
                onChangeText={setTempDescription}
                placeholder="Enter your description"
                placeholderTextColor="#888"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <View style={styles.modalButtonsRow}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={saveProfile}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
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
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#333',
    fontSize: 18,
    marginTop: 20,
  },
  circularFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  addImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#00b2a9',
  },
  namePlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  descriptionPlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 0,
    minHeight: 24,
    maxWidth: 320,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    marginBottom: 0,
    width: '100%',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#00b2a9',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 120,
    maxWidth: 180,
    elevation: 2,
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 120,
    maxWidth: 180,
    elevation: 2,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
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
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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