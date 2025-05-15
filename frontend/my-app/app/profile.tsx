import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ScrollView, Image, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const getName = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) setUserName(name);
    };
    getName();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/onboarding');
  };

  const renderOption = (label: string, icon?: string) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionText}>{label}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.subtext}>3.0 Self-Reported</Text>

      <View style={styles.section}>
        {renderOption('Profile')}
        {renderOption('Rating')}
        {renderOption('Location')}
        {renderOption('Notifications')}
        {renderOption('Payments')}
        {renderOption('Get Help')}
        {renderOption('More Settings')}
      </View>

      <View style={styles.section}>
        <Pressable style={styles.grayButton}>
          <Text style={styles.grayButtonText}>Privacy</Text>
        </Pressable>
        <Pressable style={styles.grayButton}>
          <Text style={styles.grayButtonText}>Terms</Text>
        </Pressable>
        <Pressable style={styles.redButton} onPress={handleLogout}>
          <Text style={styles.redButtonText}>Log out</Text>
        </Pressable>
      </View>

      <Text style={styles.versionText}>Version 1.0.0 (Build 001)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 100,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9ACD32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1976D2',
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#111',
  },
  grayButton: {
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  grayButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  redButton: {
    backgroundColor: '#FFCDD2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  redButtonText: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 30,
  },
});
