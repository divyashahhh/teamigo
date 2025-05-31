import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ScrollView,
  Image, Platform, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
const BACKEND_URL = 'http://192.168.1.116:5002';
export default function ProfileScreen() {
  const [userName, setUserName] = useState('User');
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const getName = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUserName(name);
        setNewName(name);
      }
    };
    getName();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/onboarding');
  };

  const saveNewName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
  
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('🧠 userId:', userId); 
  
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }
  
      const response = await axios.put(`${BACKEND_URL}/users/${userId}`, {
        name: newName.trim(),
      });
  
      const updatedName = response.data.user.name;
      await AsyncStorage.setItem('userName', updatedName);
      setUserName(updatedName);
      setEditing(false);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (err) {
      console.error('Error updating name:', err);
      Alert.alert('Error', 'Failed to update name');
    }
  };

  const renderOption = (label: string) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionText}>{label}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('@/assets/images/image.png')}
        style={styles.profileImage}
      />
      
      {editing ? (
        <>
          <TextInput
            style={styles.nameInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter your name"
            placeholderTextColor="#888"
          />
          <Pressable style={styles.saveButton} onPress={saveNewName}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.nameText}>{userName}</Text>
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.editLink}>Edit Name</Text>
          </Pressable>
        </>
      )}

      {renderOption('Settings')}
      {renderOption('Notifications')}
      {renderOption('Privacy')}
      
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: '#002233',
    flexGrow: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameInput: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '80%',
    textAlign: 'center',
    marginBottom: 10,
  },
  editLink: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#00AFAF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  optionRow: {
    width: '100%',
    paddingVertical: 16,
    borderBottomColor: '#445E6B',
    borderBottomWidth: 1,
    marginTop: 20,
  },
  optionText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#FF4444',
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});