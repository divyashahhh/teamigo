import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform,
  TextInput, Image, Modal, ScrollView, KeyboardAvoidingView, FlatList
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import BottomNavigation from '@/components/BottomNavigation';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function PortalScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [name, setName] = useState('Name');
  const [description, setDescription] = useState('Description');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        Alert.alert('Error', 'Could not fetch user data');
        return;
      }

      // Fetch user profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        Alert.alert('Error', 'Could not fetch profile data');
        return;
      }

      // Set profile data
      setName(profileData.name || 'Name');
      setDescription(profileData.description || 'Description');
      setProfileImageUrl(profileData.profile_image_url);
      setSubscriberCount(profileData.subscriber_count || 0);
      setTags(profileData.tags || []);
      setLocation(
        profileData.location_lat && profileData.location_lng
          ? { lat: profileData.location_lat, lng: profileData.location_lng, address: profileData.location_address || '' }
          : null
      );
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        Alert.alert('Error', 'Failed to logout properly');
        return;
      }

      console.log('Logged out successfully');
      // Navigate to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Try fallback to 'images' string for mediaTypes
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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setSaving(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      console.log('Profile image URL:', urlData.publicUrl);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_image_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setProfileImageUrl(urlData.publicUrl);
      Alert.alert('Success', 'Profile image updated!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
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
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          name: tempName.trim(),
          description: tempDescription.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setName(tempName.trim());
      setDescription(tempDescription.trim());
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

  // Fetch popular tags for suggestions
  const fetchPopularTags = async () => {
    const { data, error } = await supabase.rpc('get_popular_tags');
    if (!error && data) setTagSuggestions(data);
  };

  // Add tag
  const addTag = (tag: string) => {
    if (tags.length < 3 && tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };
  // Remove tag
  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // Save tags/location to Supabase
  const saveTagsAndLocation = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('profiles').update({
      tags,
      location_lat: location?.lat,
      location_lng: location?.lng,
      location_address: location?.address,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    console.log('Save response:', { data, error });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to save tags/location');
      return;
    }
    await fetchUserProfile();
    Alert.alert('Success', 'Tags and location updated!');
  };

  // Map/location picker logic
  const openLocationModal = async () => {
    setLocationModalVisible(true);
    // Get current location for map center
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };
  const selectLocation = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ lat: latitude, lng: longitude, address: '' });
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };
  const saveLocation = async () => {
    // Optionally reverse geocode address
    let address = '';
    if (location) {
      let res = await Location.reverseGeocodeAsync({ latitude: location.lat, longitude: location.lng });
      if (res && res[0]) {
        address = `${res[0].name || ''} ${res[0].street || ''}, ${res[0].city || ''}, ${res[0].region || ''}`;
        setLocation({ ...location, address });
      }
    }
    setLocationModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b2a9" />
        <Text style={styles.loadingText}>Loading portal...</Text>
      </View>
    );
  }

  console.log('Rendering profileImageUrl:', profileImageUrl);

  return (
    <View style={styles.mainContainer}>
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

        {/* Subscriber Count */}
        <Text style={styles.subscriberCount}>{subscriberCount} subscribers</Text>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tag}><Text>{tag}</Text><Pressable onPress={() => removeTag(tag)}><Text>×</Text></Pressable></View>
            ))}
            {tags.length < 3 && (
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tag"
                onSubmitEditing={() => addTag(tagInput.trim())}
              />
            )}
          </View>
          {/* Suggestions */}
          {tagInput.length > 0 && tagSuggestions.length > 0 && (
            <FlatList
              data={tagSuggestions.filter(s => s.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(s)).slice(0, 5)}
              renderItem={({ item }) => (
                <Pressable onPress={() => addTag(item)}><Text style={styles.suggestion}>{item}</Text></Pressable>
              )}
              keyExtractor={item => item}
              horizontal
            />
          )}
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Pressable style={styles.locationButton} onPress={openLocationModal}>
            <Text>{location ? location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Set Location'}</Text>
          </Pressable>
          {location && (
            <MapView
              style={styles.mapPreview}
              region={{
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              pointerEvents="none"
            >
              <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
            </MapView>
          )}
        </View>

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
      
      {/* Location picker modal */}
      <Modal visible={locationModalVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={selectLocation}
          >
            {location && <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />}
          </MapView>
          <Pressable style={styles.saveLocationButton} onPress={saveLocation}><Text>Save Location</Text></Pressable>
          <Pressable style={styles.cancelLocationButton} onPress={() => setLocationModalVisible(false)}><Text>Cancel</Text></Pressable>
        </View>
      </Modal>

      {/* Save tags/location button */}
      <Pressable style={styles.saveTagsLocationButton} onPress={saveTagsAndLocation}><Text>Save Tags & Location</Text></Pressable>
      
      <BottomNavigation userRole="host" currentTab="home" />
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
  subscriberCount: {
    fontSize: 18,
    color: '#00b2a9',
    fontWeight: '600',
    marginBottom: 0,
    marginTop: 8,
    minHeight: 24,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    marginBottom: 0,
    width: '100%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 16,
  },
  tagInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
  },
  suggestion: {
    padding: 8,
  },
  locationButton: {
    backgroundColor: '#00b2a9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveLocationButton: {
    backgroundColor: '#00b2a9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelLocationButton: {
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveTagsLocationButton: {
    backgroundColor: '#00b2a9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});
