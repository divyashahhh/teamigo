import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, Pressable, TouchableOpacity, Text as RNText, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabaseClient';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../onboarding/onboarding';

const { width } = Dimensions.get('window');

// OnboardingScreen wrapper to add Login/Signup buttons on last slide
function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [page, setPage] = useState(0);
  // const scrollRef = useRef<any>(null); // Not needed since we don't use ref

  // Copy onboardingData from onboarding.tsx for button logic
  // const onboardingData = [
  //   { title: 'Welcome to Teamigo!' },
  //   { title: 'Effortless!' },
  //   { title: 'Join and Grow!' },
  // ];

  // Render onboarding with custom buttons on last slide
  return (
    <View style={{ flex: 1 }}>
      <OnboardingWithButtons
        page={page}
        setPage={setPage}
        onComplete={onComplete}
      />
    </View>
  );
}

// Custom onboarding with Login/Signup buttons on last slide
function OnboardingWithButtons({ page, setPage, onComplete }: any) {
  // const onboardingData = [
  //   { title: 'Welcome to Teamigo!' },
  //   { title: 'Effortless!' },
  //   { title: 'Join and Grow!' },
  // ];
  return (
    <View style={{ flex: 1 }}>
      <Onboarding
        page={page}
        setPage={setPage}
        customButtons={
          page === 2 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#222B45', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginRight: 12 }}
                onPress={() => router.push('/auth/login')}
              >
                <RNText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Login</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#fff', borderWidth: 2, borderColor: '#222B45', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
                onPress={() => router.push('/auth/signup')}
              >
                <RNText style={{ color: '#222B45', fontSize: 18, fontWeight: 'bold' }}>Sign Up</RNText>
              </TouchableOpacity>
            </View>
          ) : null
        }
        onLastSlideComplete={onComplete}
      />
    </View>
  );
}

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const checkLoginStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Check if user wants to be remembered
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (!rememberMe && !onboardingComplete) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 8000)
      );
      const authPromise = supabase.auth.getUser();
      const { data: { user }, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;
      if (authError && authError.message && authError.message.includes('Auth session missing')) {
        setShowOnboarding(false);
        await router.push('./auth/login');
        return;
      }
      if (authError) {
        setShowOnboarding(false);
        setError('Authentication error');
        await router.push('./auth/login');
        return;
      }
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profileError) {
            setShowOnboarding(true);
            setLoading(false);
            return;
          }
          const userRole = profileData?.role || 'member';
          if (userRole === 'host') {
            await router.push('/(host)/(tabs)/portal');
          } else {
            await router.push('/(member)/(tabs)/profile');
          }
        } catch (redirectError) {
          setError('Navigation error');
        }
      } else {
        setShowOnboarding(false);
        await router.push('./auth/login');
      }
    } catch (error) {
      setError('Connection error - tap to retry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkLoginStatus();
      } catch (error) {
        setError('App initialization failed');
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch {}
      }
    };
    const timeout = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {}
    }, 5000);
    initializeApp();
    return () => clearTimeout(timeout);
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkLoginStatus();
  };

  // Custom onboarding logic
  if (showOnboarding) {
    return <OnboardingScreen onComplete={async () => {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      await AsyncStorage.removeItem('rememberMe');
      setShowOnboarding(false);
      setLoading(true);
      checkLoginStatus();
    }} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#00b2a9" />
        <Text style={{ marginTop: 10, color: '#666' }}>
          Checking authentication...
        </Text>
        {error && (
          <Text style={{ marginTop: 10, color: '#ff0000' }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#ff0000', marginBottom: 20, textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable 
          onPress={handleRetry}
          style={{
            backgroundColor: '#00b2a9',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Retry
          </Text>
        </Pressable>
        <Pressable 
          onPress={handleRetry}
          style={{
            marginTop: 10,
            paddingHorizontal: 20,
            paddingVertical: 10
          }}
        >
          <Text style={{ color: '#00b2a9', fontWeight: '600' }}>
            Go to Login
          </Text>
        </Pressable>
      </View>
    );
  }

  return null;
}