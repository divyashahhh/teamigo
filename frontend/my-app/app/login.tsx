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
import { signInWithApple } from '../utils/appleAuth';
import axios from 'axios';

const BACKEND_URL = API_URL;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();

        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userName', data.name);
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('userId', data.id.toString());

        if (data.role === 'host') {
          router.replace('/host/setup' as never);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        const data = await res.json();
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
  
      if (!result) {
        Alert.alert('Apple Sign-In Failed');
        return;
      }
  
      const generatedEmail = result.email || `${result.user}@privaterelay.appleid.com`;

      const payload = {
      email: generatedEmail,
      name: result.fullName?.givenName || 'Apple User',
      apple_user_id: result.user,
      };
  
      console.log('🔒 Apple Payload:', payload);
  
      const response = await axios.post(`${BACKEND_URL}/apple-login`, payload);
      const user = response.data;
  
  
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userId', user.id.toString());
      await AsyncStorage.setItem('userName', user.name || 'Apple User');
      await AsyncStorage.setItem('userRole', user.role || 'member');
  
      console.log('✅ Logged in as:', user.name, `(ID: ${user.id})`);
  
      if (user.role === 'host') {
        router.replace('/host/setup' as never);
      } else {
        router.replace('/(tabs)');
      }
  
    } catch (err) {
      console.error('Apple login error:', err);
      Alert.alert('Apple Login Failed', 'Could not authenticate with Apple.');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.replace('/onboarding')}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Login to your account</Text>
      <Text style={styles.subtitle}>Welcome back to Teamigo</Text>

      <View style={styles.form}>
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
          placeholder="Your Password"
          placeholderTextColor="#B0BEC5"
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

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={16}
          style={styles.appleButton}
          onPress={handleAppleLogin}
        />
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  remember: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  forgot: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#00AFAF',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#00AFAF',
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
});