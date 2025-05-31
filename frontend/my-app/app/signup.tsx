import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Platform, Image,
  TouchableOpacity, ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple } from '../utils/appleAuth'; 

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'member' | 'host'>('member');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Info', 'All fields are required');
      return;
    }

    try {
      const res = await fetch('http://192.168.1.116:5002/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
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

  const handleAppleSignup = async () => {
    const result = await signInWithApple();
    if (result) {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userName', result.fullName?.givenName || 'Apple User');
      await AsyncStorage.setItem('userRole', 'member'); // or inferred
      await AsyncStorage.setItem('userId', result.user);

      router.replace('/(tabs)');
    } else {
      Alert.alert('Signup Failed', 'Apple Sign-In was cancelled or failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.replace('/onboarding')}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Create a Teamigo account</Text>
        <Text style={styles.subtitle}>Let's get you set up</Text>

        <View style={styles.form}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={16}
            style={styles.appleButton}
            onPress={handleAppleSignup}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

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

          <Text style={styles.label}>Sign up as:</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'member' && styles.roleSelected]}
              onPress={() => setRole('member')}
            >
              <Text style={[styles.roleText, role === 'member' && styles.roleTextSelected]}>
                Member
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'host' && styles.roleSelected]}
              onPress={() => setRole('host')}
            >
              <Text style={[styles.roleText, role === 'host' && styles.roleTextSelected]}>
                Host
              </Text>
            </TouchableOpacity>
          </View>

          <Pressable style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupText}>Sign Up</Text>
          </Pressable>
        </View>

        {/* LOGO moved here to bottom */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/image.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoCaption}>powered by Teamigo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#445E6B',
  },
  dividerText: {
    color: '#B0BEC5',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  appleButton: {
    width: '100%',
    height: 44,
    marginTop: 8,
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
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#445E6B',
    backgroundColor: '#10364A',
    alignItems: 'center',
  },
  roleSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#00AFAF',
  },
  roleText: {
    fontWeight: '600',
    color: '#B0BEC5',
  },
  roleTextSelected: {
    color: '#000000',
  },
  signupButton: {
    backgroundColor: '#00AFAF',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#092A3D',
    borderRadius: 16,
    marginTop: 28,
    marginBottom: 20,
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
});