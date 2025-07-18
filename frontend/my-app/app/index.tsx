import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabaseClient';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkLoginStatus = async () => {
    try {
      console.log('Starting auth check... (attempt:', retryCount + 1, ')');
      setLoading(true);
      setError(null);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 8000)
      );
      
      const authPromise = supabase.auth.getUser();
      
      const { data: { user }, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;

      console.log('Auth check completed:', { user: !!user, error: authError });

      // Check if this is just a "no session" error (normal when not logged in)
      if (authError && authError.message && authError.message.includes('Auth session missing')) {
        console.log('No user session found, redirecting to login...');
        try {
          await router.push('./auth/login');
          console.log('Redirect to login completed');
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          setError('Navigation error');
        }
        return;
      }

      // Handle other auth errors
      if (authError) {
        console.error('Auth check error:', authError);
        setError('Authentication error');
        try {
          await router.push('./auth/login');
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          setError('Navigation error');
        }
        return;
      }

      if (user) {
        console.log('User found, checking role...');
        try {
          // Fetch user role from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Default to signup poage if no user found
            console.log('No profile found, defaulting to member');
            await router.push('../auth/signup');
            return;
          }

          const userRole = profileData?.role || 'member';
          console.log('User role found:', userRole);

          // Redirect based on role
          if (userRole === 'host') {
            console.log('Redirecting to host portal...');
            await router.push('/(host)/(tabs)/portal');
          } else {
            console.log('Redirecting to member profile...');
            await router.push('/(member)/(tabs)/profile');
          }
          console.log('Role-based redirect completed');
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          setError('Navigation error');
        }
      } else {
        console.log('No user found, redirecting to login...');
        try {
          await router.push('./auth/login');
          console.log('Redirect to login completed');
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          setError('Navigation error');
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth check:', error);
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
        console.error('Error during app initialization:', error);
        setError('App initialization failed');
      } finally {
        // Always hide the splash screen after auth check is complete
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden');
        } catch (splashError) {
          console.error('Error hiding splash screen:', splashError);
        }
      }
    };

    // Add a timeout to ensure splash screen is hidden
    const timeout = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('Splash screen hidden by timeout');
      } catch (error) {
        console.error('Error hiding splash screen by timeout:', error);
      }
    }, 5000); // 5 second timeout
    
    initializeApp();
    
    return () => clearTimeout(timeout);
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkLoginStatus();
  };

  const handleManualLogin = async () => {
    console.log('Manual login button pressed');
    try {
      await router.push('./auth/login');
      console.log('Manual redirect to login completed');
    } catch (error) {
      console.error('Manual redirect error:', error);
      setError('Manual navigation failed');
    }
  };

  if (loading) {
    console.log('Rendering loading screen');
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
    console.log('Rendering error screen');
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
          onPress={handleManualLogin}
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