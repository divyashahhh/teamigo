import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform,
  TextInput, Image, Modal, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';

interface Club {
  id: string;
  name: string;
  description: string;
  profile_image_url: string | null;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Name');
  const [description, setDescription] = useState('Description');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [clubs, setClubs] = useState<Club[]>([]);
  const { hostIds, loading: loadingClubs } = useMemberSubscriptions();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fetchSubscriptionCount = useCallback(async (userId: string) => {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', userId);
    if (!error && typeof count === 'number') {
      setSubscriptionCount(count);
    } else {
      setSubscriptionCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchClubs = async () => {
      if (hostIds.length === 0) {
        setClubs([]);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('id, name, description, profile_image_url')
        .in('id', hostIds);
      if (!error && data) {
        setClubs(data);
      } else {
        setClubs([]);
      }
    };
    fetchClubs();
  }, [hostIds]);

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
      setProfileImageUrl(profileData.profile_image_url ? profileData.profile_image_url + '?t=' + Date.now() : null);
      setBackgroundImageUrl(profileData.background_image_url ? profileData.background_image_url + '?t=' + Date.now() : null);
      fetchSubscriptionCount(user.id);
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

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgmcfhlkc/image/upload';
  const CLOUDINARY_PRESET = 'user_uploads';

  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const data = new FormData();
    data.append('file', `data:image/jpeg;base64,${base64}`);
    data.append('upload_preset', CLOUDINARY_PRESET);
    data.append('folder', 'profile_pics'); // Ensure all images go to the same folder
    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: data,
    });
    const result = await res.json();
    if (result.secure_url) {
      return result.secure_url;
    } else {
      throw new Error('Cloudinary upload failed');
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
      const cloudinaryUrl = await uploadToCloudinary(uri);
      setProfileImageUrl(cloudinaryUrl + '?t=' + Date.now());
      await supabase
        .from('users')
        .update({ 
          profile_image_url: cloudinaryUrl,
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

  const pickBackgroundImage = async () => {
    try {
      console.log('Background image picker triggered');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        console.log('Background image selected:', result.assets[0].uri);
        await uploadBackgroundImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking background image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadBackgroundImage = async (uri: string) => {
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }
      const cloudinaryUrl = await uploadToCloudinary(uri);
      setBackgroundImageUrl(cloudinaryUrl + '?t=' + Date.now());
      await supabase
        .from('users')
        .update({ 
          background_image_url: cloudinaryUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      Alert.alert('Success', 'Background image updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    // Only require name if it's empty (new user)
    if (!tempName.trim() && !name.trim()) {
      Alert.alert('Error', 'Name cannot be empty for new users');
      return;
    }

    try {
      setSaving(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Prepare update data - only include fields that have values
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update name if it's provided and different from current
      if (tempName.trim() && tempName.trim() !== name) {
        updateData.name = tempName.trim();
      }

      // Only update description if it's provided and different from current
      if (tempDescription.trim() !== description) {
        updateData.description = tempDescription.trim();
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 1) { // More than just updated_at
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('Update error:', updateError);
          Alert.alert('Error', 'Failed to update profile');
          return;
        }

        // Update local state
        if (updateData.name) setName(updateData.name);
        if (updateData.description) setDescription(updateData.description);
      }

      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
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
    <LinearGradient colors={['#1A237E', '#222B45', '#0A0F2C']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', minHeight: '100%' }}>
        {/* Top bar with Settings and Chats buttons */}
        <View style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 }}>
          <Pressable onPress={() => setShowSettingsModal(true)} style={{ padding: 8 }}>
            <Image source={require('@/assets/icons/settings.png')} style={{ width: 28, height: 28, tintColor: '#00b2a9' }} />
          </Pressable>
          <Pressable onPress={() => router.push({
          pathname: '/(member)/chats' as any,
          params: { from: 'profile' }
        })} style={{ padding: 8 }}>
            <Image source={require('@/assets/icons/chat.png')} style={{ width: 28, height: 28, tintColor: '#00b2a9' }} />
          </Pressable>
        </View>
        {/* Background image with overlayed profile info */}
        <View style={{ position: 'relative', height: 320, width: '100%' }}>
          <Image
            source={backgroundImageUrl ? { uri: backgroundImageUrl } : require('@/assets/images/image.png')}
            style={{ width: '100%', height: 320, position: 'absolute' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0)']}
            style={{ position: 'absolute', width: '100%', height: 320 }}
          />
          
          {/* Additional gradient for text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={{ position: 'absolute', width: '100%', height: 320, top: 0 }}
          />
          
          {/* Background pressable - excludes the profile area */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
            {/* Top area (above profile) */}
            <Pressable
              onLongPress={pickBackgroundImage}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60 }}
            />
            {/* Left area (left of profile) */}
            <Pressable
              onLongPress={pickBackgroundImage}
              style={{ position: 'absolute', top: 60, left: 0, width: '50%', height: 100 }}
            />
            {/* Right area (right of profile) */}
            <Pressable
              onLongPress={pickBackgroundImage}
              style={{ position: 'absolute', top: 60, right: 0, width: '50%', height: 100 }}
            />
            {/* Bottom area (below profile) */}
            <Pressable
              onLongPress={pickBackgroundImage}
              style={{ position: 'absolute', top: 160, left: 0, right: 0, bottom: 0 }}
            />
          </View>
          
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 3 }}>
            <Pressable
              style={{
                borderRadius: 50,
                borderWidth: 4,
                borderColor: '#fff',
                overflow: 'hidden',
                backgroundColor: '#eee',
                width: 100,
                height: 100,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 7, // Higher than background pressable
              }}
              onLongPress={pickImage}
            >
              <Image
                source={profileImageUrl ? { uri: profileImageUrl } : require('@/assets/images/image.png')}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                resizeMode="cover"
              />
            </Pressable>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 12 }}>{name}</Text>
            <Text style={{ fontSize: 16, color: '#E0E7FF', marginBottom: 8, textAlign: 'center', maxWidth: 320 }}>{description}</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222B45' }}>{subscriptionCount}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Subscriptions</Text>
            </View>
          </View>
        </View>
        {/* My Clubs section */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>My Clubs</Text>
          {loadingClubs ? (
            <ActivityIndicator size="small" color="#C6FFF6" />
          ) : clubs.length === 0 ? (
            <Text style={{ color: '#E0E7FF', fontSize: 16 }}>You have not joined any clubs yet.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {clubs.map(club => (
                <View key={club.id} style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 16,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Image
                    source={club.profile_image_url ? { uri: club.profile_image_url } : require('@/assets/images/image.png')}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 16, backgroundColor: '#eee' }}
                    resizeMode="cover"
                  />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222B45', flex: 1 }} numberOfLines={1}>{club.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {/* Settings Modal */}
        <Modal visible={showSettingsModal} animationType="fade" transparent onRequestClose={() => setShowSettingsModal(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-start' }} onPress={() => setShowSettingsModal(false)}>
            <View style={{ marginTop: 80, marginLeft: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}>
              <Pressable onPress={() => { setShowSettingsModal(false); setShowEditModal(true); }} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 18, color: '#222B45', fontWeight: 'bold' }}>Edit Profile</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 6 }} />
              <Pressable onPress={() => { setShowSettingsModal(false); handleLogout(); }} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 18, color: '#FF4444', fontWeight: 'bold' }}>Log Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
        {/* Edit Profile Modal */}
        <Modal visible={showEditModal} animationType="fade" transparent onRequestClose={() => setShowEditModal(false)}>
          <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]} onPress={() => setShowEditModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              {/* Profile Picture Section */}
              <Text style={styles.inputLabel}>Profile Picture</Text>
              <Pressable 
                style={styles.imageEditButton}
                onPress={pickImage}
              >
                <Text style={styles.imageEditButtonText}>Change Profile Picture</Text>
              </Pressable>
              
              {/* Background Image Section */}
              <Text style={styles.inputLabel}>Background Image</Text>
              <Pressable 
                style={styles.imageEditButton}
                onPress={pickBackgroundImage}
              >
                <Text style={styles.imageEditButtonText}>Change Background Image</Text>
              </Pressable>
              
              <TextInput
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Name"
                placeholderTextColor="#666"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={tempDescription}
                onChangeText={setTempDescription}
                placeholder="Description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtonsRow}>
                <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.saveButton]} onPress={saveProfile}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </LinearGradient>
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
    backgroundColor: 'transparent', // Changed from #fff to transparent
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
    color: '#fff', // Changed from #333 to #fff
    marginBottom: 18,
    textAlign: 'left',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Changed from #333 to #fff
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
  imageEditButton: {
    backgroundColor: '#00b2a9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  imageEditButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 