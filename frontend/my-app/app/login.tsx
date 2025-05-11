import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch('http://192.168.1.116:5002/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json(); 
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userName', data.name);
        router.replace('/(tabs)');   
           
      } else {
        const data = await res.json();
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to your account.</Text>
      <Text style={styles.subtitle}>Hello, welcome back to your account</Text>

      <View style={styles.form}>
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
          placeholder="Your Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.optionsRow}>
          <Text style={styles.remember}>Remember me</Text>
          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
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
  optionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginVertical: 12,
  },
  remember: { fontSize: 14, color: '#666' },
  forgot: { fontSize: 14, color: '#5B4EFF', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#5B4EFF',
    paddingVertical: 14, borderRadius: 12, marginTop: 10,
  },
  loginText: {
    textAlign: 'center', color: 'white',
    fontSize: 16, fontWeight: '600',
  },
});