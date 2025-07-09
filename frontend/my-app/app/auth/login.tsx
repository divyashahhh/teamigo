import { API_URL } from '@env';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect} from 'react';
import { supabase } from '@/utils/supabaseClient';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please fill in all fields');
        return;
      }

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (authError) {
        Alert.alert('Login Failed', authError.message);
        return;
      }
  
      if (authData.user) {
        // Fetch user role from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();
      
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          Alert.alert('Error', 'Could not retrieve user profile. Please try again.');
          return;
        }

        const userRole = profileData?.role || 'member'; // Default to member if no role found

        console.log('Login successful, user role:', userRole);
        Alert.alert('Login Successful', `Welcome back! Redirecting to ${userRole} dashboard.`);

        // Redirect based on role
        if (userRole === 'host') {
          router.push('../(host)/(tabs)/portal');
        } else {
          router.push('../(member)/(tabs)/profile');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to your account</Text>
      <Text style={styles.subtitle}>Welcome back to Teamigo</Text>

      <View style={styles.form}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          placeholder="example@email.com"
          placeholderTextColor="#888"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Your Password"
          placeholderTextColor="#888"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.optionsRow}>
          <Text style={styles.remember}>Remember me</Text>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </View>

        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </Pressable>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('./signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
        </Pressable>
        </View>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/image.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoCaption}>powered by Teamigo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: '#fff',
  },
  back: {
    color: '#00b2a9',
    fontWeight: '600',
    marginBottom: 20,
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 140,
    height: 50,
  },
  logoCaption: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  remember: {
    fontSize: 14,
    color: '#666',
  },
  forgot: {
    fontSize: 14,
    color: '#00b2a9',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#00b2a9',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#00b2a9',
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 44,
    marginTop: 8,
  },
});