import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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

      const finalRole = existingUser?.role || user.user_metadata?.role || 'member';
      await AsyncStorage.setItem('userRole', finalRole);
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberMe');
      }

      Alert.alert('Login Successful', `Welcome back, ${finalRole}!`);

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
    <LinearGradient colors={['#EAF0FF', '#FFF6E0', '#C6FFF6']} style={{ flex: 1 }}>
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
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Your password"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#888"
          />

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#222B45', marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: rememberMe ? '#222B45' : 'transparent',
            }}>
              {rememberMe && <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#fff' }} />}
            </View>
            <Text style={{ color: '#222B45', fontSize: 16, fontWeight: '500' }}>Remember me</Text>
          </TouchableOpacity>

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    // Remove backgroundColor here to let LinearGradient show
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222B45',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
  },
  label: {
    marginBottom: 6,
    color: '#222B45',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#222B45',
    backgroundColor: '#F3F6FD',
    marginBottom: 14,
  },
  loginButton: {
    backgroundColor: '#222B45',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  signupText: {
    color: '#222B45',
    fontSize: 14,
  },
  signupLink: {
    color: '#2B2BFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
  },
  logo: {
    width: 140,
    height: 50,
  },
  logoCaption: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
  },
});