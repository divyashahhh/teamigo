import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Info', 'All fields are required');
      return;
    }

    try {
      const res = await fetch('http://192.168.1.116:5002/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'member' }),
      });

      if (res.ok) {
        Alert.alert('Account Created', 'Please log in now.');
        router.replace('/login');
      } else {
        const data = await res.json();
        Alert.alert('Signup Failed', data.error || 'Try again later');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.replace('/onboarding')}>
  <Text style={styles.back}>← Back </Text>
</Pressable>
      <Text style={styles.title}>Create a Teamigo account</Text>
      <Text style={styles.subtitle}>Let’s get you set up</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Your Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          placeholder="example@email.com"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Create Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupText}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 30,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: '#fff'
  },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 30 },
  form: { marginBottom: 20 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    borderRadius: 12, padding: 12,
    fontSize: 16, backgroundColor: '#fafafa'
  },
  signupButton: {
    backgroundColor: '#5B4EFF',
    paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  signupText: {
    textAlign: 'center', color: 'white',
    fontSize: 16, fontWeight: '600',
  },
  back: {
    color: '#5B4EFF',
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 16,
  }
});






