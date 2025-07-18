import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabaseClient';

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Login error:', loginError);
        Alert.alert('Login Failed', loginError.message);
        return;
      }

      const user = authData.user;
      if (!user) {
        Alert.alert('Login Failed', 'No user returned from Supabase.');
        return;
      }

      if (!user.email_confirmed_at) {
        Alert.alert(
          'Email Not Verified',
          'Please check your email and click the verification link before logging in.'
        );
        return;
      }

      // Sync email_verified in public.users if verified
      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', user.id);

      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking users table:', userCheckError);
        Alert.alert('Login Failed', 'Could not check user role.');
        return;
      }

      // If user does not exist in public.users, insert
      if (!existingUser) {
        const insertRole = user.user_metadata?.role || 'member';

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: insertRole,
            email_verified: true,
          });

        if (insertError) {
          console.error('Error inserting new user into users table:', insertError);
          Alert.alert('Login Failed', 'Failed to create user record.');
          return;
        }
      }

      // Save role to local storage
      const finalRole = existingUser?.role || user.user_metadata?.role || 'member';
      await AsyncStorage.setItem('userRole', finalRole);

      Alert.alert('Login Successful', `Welcome back, ${finalRole}!`);

      // Navigate based on role
      if (finalRole === 'host') {
        router.replace('/portal');
      } else {
        router.replace('/profile');
      }

    } catch (error) {
      console.error('Unexpected login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log in to Teamigo</Text>
        <Text style={styles.subtitle}>Let's get you started</Text>

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
          placeholder="Your password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </Pressable>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('./signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>

        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/image.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.logoCaption}>powered by Teamigo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: '#fff',
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
  label: {
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
    marginBottom: 14,
  },
  loginButton: {
    backgroundColor: '#00b2a9',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  signupText: {
    color: '#333',
    fontSize: 14,
  },
  signupLink: {
    color: '#00b2a9',
    fontWeight: '700',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
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
});