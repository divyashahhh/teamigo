import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform,
  TextInput, Image, Modal, ScrollView, KeyboardAvoidingView, FlatList, Dimensions
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import BottomNavigation from '@/components/BottomNavigation';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

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
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

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
      // Upload to Supabase Storage (portal-images bucket)
      const fileName = `portal-${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portal-images')
        .upload(fileName, blob, { upsert: true });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image');
        return;
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('portal-images')
        .getPublicUrl(fileName);
      console.log('Portal image URL:', urlData.publicUrl);
      // Update profile with new portal image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          portal_image_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Failed to update portal image');
        return;
      }
      setProfileImageUrl(urlData.publicUrl);
      Alert.alert('Success', 'Portal image updated!');
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
      setShowTagSuggestions(false);
    }
  };

  // Remove tag
  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // Save tags/location to Supabase
  const saveTagsAndLocation = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      setSaving(false);
      return;
    }
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

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Profile Image */}
          <Pressable style={styles.circularFrame} onPress={pickImage}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} resizeMode="cover" />
            ) : (
              <Text style={styles.addImageText}>+</Text>
            )}
          </Pressable>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
              {description}
            </Text>
            <View style={styles.subscriberContainer}>
              <Text style={styles.subscriberCount}>{subscriberCount}</Text>
              <Text style={styles.subscriberLabel}>subscribers</Text>
            </View>
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <Text style={styles.sectionSubtitle}>Add up to 3 tags to describe your portal</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagContainer}>
                <Text style={styles.tagText}>{tag}</Text>
                <Pressable 
                  style={styles.removeTagButton} 
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.removeTagText}>×</Text>
                </Pressable>
              </View>
            ))}
            
            {tags.length < 3 && (
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={(text) => {
                    setTagInput(text);
                    setShowTagSuggestions(text.length > 0);
                  }}
                  placeholder="Add a tag..."
                  placeholderTextColor="#999"
                  onSubmitEditing={() => addTag(tagInput.trim())}
                  onFocus={() => {
                    setShowTagSuggestions(tagInput.length > 0);
                    fetchPopularTags();
                  }}
                />
              </View>
            )}
          </View>

          {/* Tag Suggestions */}
          {showTagSuggestions && tagInput.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={tagSuggestions.filter(s => 
                  s.toLowerCase().includes(tagInput.toLowerCase()) && 
                  !tags.includes(s)
                ).slice(0, 5)}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.suggestionItem}
                    onPress={() => addTag(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </Pressable>
                )}
                keyExtractor={item => item}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.sectionSubtitle}>Set your portal's location for members to find you</Text>
          </View>
          
          <Pressable style={styles.locationCard} onPress={openLocationModal}>
            {location ? (
              <View style={styles.locationInfo}>
                <View style={styles.locationIcon}>
                  <Text style={styles.locationIconText}>📍</Text>
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationAddress}>
                    {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                  </Text>
                  <Text style={styles.locationHint}>Tap to change location</Text>
                </View>
                <View style={styles.locationArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            ) : (
              <View style={styles.locationInfo}>
                <View style={styles.locationIcon}>
                  <Text style={styles.locationIconText}>📍</Text>
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationPlaceholder}>Set your location</Text>
                  <Text style={styles.locationHint}>Tap to add location</Text>
                </View>
                <View style={styles.locationArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            )}
          </Pressable>

          {/* Map Preview */}
          {location && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.mapPreview}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                pointerEvents="none"
                mapType="standard"
              >
                <Marker 
                  coordinate={{ latitude: location.lat, longitude: location.lng }}
                  pinColor="#00b2a9"
                />
              </MapView>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={saveTagsAndLocation}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
          
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

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
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>Select Location</Text>
            <Text style={styles.locationModalSubtitle}>Tap on the map to set your location</Text>
          </View>
          
          <MapView
            style={styles.locationModalMap}
            region={mapRegion}
            onPress={selectLocation}
            showsUserLocation
            showsMyLocationButton
          >
            {location && (
              <Marker 
                coordinate={{ latitude: location.lat, longitude: location.lng }}
                pinColor="#00b2a9"
              />
            )}
          </MapView>
          
          <View style={styles.locationModalButtons}>
            <Pressable 
              style={styles.cancelLocationButton} 
              onPress={() => setLocationModalVisible(false)}
            >
              <Text style={styles.cancelLocationButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={styles.saveLocationButton} 
              onPress={saveLocation}
            >
              <Text style={styles.saveLocationButtonText}>Save Location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    color: '#333',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  
  // Header Section
  headerSection: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  circularFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
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
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    maxWidth: width - 48,
  },
  subscriberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  subscriberCount: {
    fontSize: 24,
    color: '#00b2a9',
    fontWeight: 'bold',
  },
  subscriberLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Section Styles
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },

  // Tags Section
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5f4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00b2a9',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00b2a9',
    marginRight: 8,
  },
  removeTagButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00b2a9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagInputContainer: {
    minWidth: 120,
  },
  tagInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Location Section
  locationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationIconText: {
    fontSize: 20,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  locationPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },
  locationHint: {
    fontSize: 14,
    color: '#666',
  },
  locationArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapPreview: {
    height: 200,
    width: '100%',
  },

  // Action Buttons
  actionButtons: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#00b2a9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 16,
  },

  // Modal Styles
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

  // Location Modal
  locationModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  locationModalHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationModalSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  locationModalMap: {
    flex: 1,
  },
  locationModalButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelLocationButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelLocationButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveLocationButton: {
    flex: 1,
    backgroundColor: '#00b2a9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveLocationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
 