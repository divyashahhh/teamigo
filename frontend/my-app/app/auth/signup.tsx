import { API_URL } from '@env';import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, Alert, Platform, Image,
  TouchableOpacity, ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple } from '../../utils/appleAuth'; 
import { supabase } from '@/utils/supabaseClient';



export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'host' | 'member'>('member');

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: selectedRole, // Store role in user metadata
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        Alert.alert('Signup Failed', error.message);
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        Alert.alert(
          'Success', 
          'Account created! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.push('./login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', 'Something went wrong. Please try again.');
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
        <Pressable onPress={() => router.push('./login')}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Create a Teamigo account</Text>
        <Text style={styles.subtitle}>Let's get you set up</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Choose your role:</Text>
          <View style={styles.roleContainer}>
            <Pressable
              style={[
                styles.roleButton,
                selectedRole === 'member' && styles.roleButtonSelected
              ]}
              onPress={() => setSelectedRole('member')}
            >
              <Text style={[
                styles.roleButtonText,
                selectedRole === 'member' && styles.roleButtonTextSelected
              ]}>
                Member
              </Text>
              <Text style={[
                styles.roleDescription,
                selectedRole === 'member' && styles.roleDescriptionSelected
              ]}>
                Join teams and participate in events
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleButton,
                selectedRole === 'host' && styles.roleButtonSelected
              ]}
              onPress={() => setSelectedRole('host')}
            >
              <Text style={[
                styles.roleButtonText,
                selectedRole === 'host' && styles.roleButtonTextSelected
              ]}>
                Host
              </Text>
              <Text style={[
                styles.roleDescription,
                selectedRole === 'host' && styles.roleDescriptionSelected
              ]}>
                Create and manage teams/events
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Account Details</Text>
            <View style={styles.dividerLine} />
          </View>

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
            placeholder="Create Password"
            placeholderTextColor="#888"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupText}>Sign Up as {selectedRole}</Text>
          </Pressable>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('./login')}>
              <Text style={styles.loginLink}>Log In</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  roleContainer: {
    marginBottom: 20,
  },
  roleButton: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleButtonSelected: {
    backgroundColor: '#e8f4fd',
    borderColor: '#00b2a9',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleButtonTextSelected: {
    color: '#00b2a9',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  roleDescriptionSelected: {
    color: '#00b2a9',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
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
  signupButton: {
    backgroundColor: '#00b2a9',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#00b2a9',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#00b2a9',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    marginTop: 28,
    marginBottom: 20,
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

