import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Platform, Image,
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
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/image.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoCaption}>powered by Teamigo</Text>
      </View>

      <Text style={styles.title}>Create a Teamigo account</Text>
      <Text style={styles.subtitle}>Let’s get you set up</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Your Name"
          placeholderTextColor="#B0BEC5"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          placeholder="example@email.com"
          placeholderTextColor="#B0BEC5"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Create Password"
          placeholderTextColor="#B0BEC5"
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
    flex: 1,
    padding: 30,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: '#002233',
  },
  back: {
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 20,
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#092A3D',
    borderRadius: 16,
    marginBottom: 28,
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 140,
    height: 50,
  },
  logoCaption: {
    color: '#B0BEC5',
    fontSize: 13,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    marginBottom: 28,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#B0BEC5',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#445E6B',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#10364A',
    marginBottom: 6,
  },
  signupButton: {
    backgroundColor: '#00AFAF',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signupText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
