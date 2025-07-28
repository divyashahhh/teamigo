import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform,
  TextInput, Image, Modal, ScrollView, KeyboardAvoidingView, FlatList, Dimensions, TouchableOpacity
} from 'react-native';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');

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

export default function PortalScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [role, setRole] = useState('member');
  const router = useRouter();

  // 1. Add state for backgroundImageUrl:
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  // Add the settings modal and edit profile modal, matching profile.tsx
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        Alert.alert('Error', 'Could not fetch profile data');
        return;
      }

      // Set profile data
      setName(profileData.name || '');
      setDescription(profileData.description || '');
      setProfileImageUrl(profileData.profile_image_url);
      setSubscriberCount(profileData.subscriber_count || 0);
      setTags(profileData.tags || []);
      setLocation(
        profileData.location_lat && profileData.location_lng
          ? { lat: profileData.location_lat, lng: profileData.location_lng, address: profileData.location_address || '' }
          : null
      );
      setRole(profileData.role || 'member');
      // 2. In fetchUserProfile, set backgroundImageUrl:
      setBackgroundImageUrl(profileData.background_image_url ? profileData.background_image_url + '?t=' + Date.now() : null);
      console.log('Fetched profileImageUrl:', profileData.profile_image_url);
      
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }
      const cloudinaryUrl = await uploadToCloudinary(uri);
      setProfileImageUrl(cloudinaryUrl + '?t=' + Date.now());
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: cloudinaryUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Failed to update profile image');
        return;
      }
      Alert.alert('Success', 'Profile image updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  // 3. Add pickBackgroundImage and uploadBackgroundImage functions (copy from profile.tsx, but update for portal):
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
      console.log('Starting background image upload...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User error:', userError);
        Alert.alert('Error', 'User not found');
        return;
      }
      
      console.log('Uploading to Cloudinary...');
      const cloudinaryUrl = await uploadToCloudinary(uri);
      console.log('Cloudinary upload successful:', cloudinaryUrl);
      
      // Update local state immediately for better UX
      setBackgroundImageUrl(cloudinaryUrl + '?t=' + Date.now());
      
      console.log('Updating database...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          background_image_url: cloudinaryUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Database update error:', updateError);
        Alert.alert('Error', 'Failed to save background image to database');
        return;
      }
      
      console.log('Background image update successful');
      Alert.alert('Success', 'Background image updated!');
    } catch (error) {
      console.error('Background image upload error:', error);
      Alert.alert('Error', 'Failed to upload background image');
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
    const { data, error } = await supabase.from('users').update({
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

  const selectLocation = (e: MapPressEvent) => {
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
    <LinearGradient colors={['#1A237E', '#222B45', '#0A0F2C']} style={{ flex: 1 }}>
      <View style={[styles.mainContainer, { backgroundColor: 'transparent' }]}>
        {/* Remove the header with chats and analytics buttons at the top right */}
        {/* Add a top bar with settings on the left and chats on the right */}
        <View style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 }}>
          <Pressable onPress={() => setShowSettingsModal(true)} style={{ padding: 8 }}>
            <Image source={require('@/assets/icons/settings.png')} style={{ width: 28, height: 28, tintColor: '#00b2a9' }} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => router.push({
              pathname: '/(host)/chats' as any,
              params: { from: 'portal' }
            })} style={{ padding: 8 }}>
             <Image source={require('@/assets/icons/chat.png')} style={{ width: 28, height: 28, tintColor: '#00b2a9' }} />
           </Pressable>
          </View>
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add background image at the top, similar to profile.tsx: */}
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
            
            {/* Show loading indicator when saving */}
            {saving && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 6
              }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>Uploading...</Text>
              </View>
            )}
            
            {/* Profile image and info overlays remain as before, but now on top of the background image */}
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
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222B45' }}>{subscriberCount}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Subscriptions</Text>
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



        {/* Add the settings modal and edit profile modal, matching profile.tsx */}
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
        <Modal visible={showEditModal} animationType="fade" transparent onRequestClose={() => setShowEditModal(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    // backgroundColor: '#f8f9fa', // Removed as it's now covered by LinearGradient
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
    backgroundColor: 'transparent', // Changed to transparent
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
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
    color: '#fff', // Changed for contrast
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc', // Changed for contrast
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
    color: '#ccc', // Changed for contrast
    fontWeight: '500',
  },

  // Section Styles
  section: {
    backgroundColor: 'transparent', // Changed to transparent
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // Changed for contrast
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#ccc', // Changed for contrast
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
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
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
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff', // Changed for contrast
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionItem: {
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#fff', // Changed for contrast
    fontWeight: '500',
  },

  // Location Section
  locationCard: {
    backgroundColor: 'transparent', // Changed to transparent
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
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
    color: '#fff', // Changed for contrast
    marginBottom: 2,
  },
  locationPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc', // Changed for contrast
    marginBottom: 2,
  },
  locationHint: {
    fontSize: 14,
    color: '#ccc', // Changed for contrast
  },
  locationArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#ccc', // Changed for contrast
    fontWeight: 'bold',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
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
    backgroundColor: 'transparent', // Changed to transparent
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
    backgroundColor: 'rgba(255,255,255,0.1)', // Adjusted for gradient
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
    color: '#fff', // Changed for contrast
    marginBottom: 18,
    textAlign: 'left',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Changed for contrast
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
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
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Image Edit Buttons
  imageEditButton: {
    backgroundColor: '#00b2a9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageEditButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  iconButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', // Adjusted for gradient
  },
  iconText: {
    fontSize: 22,
  },
});
 