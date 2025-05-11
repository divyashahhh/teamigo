import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  useEffect(() => {
    const checkStatus = async () => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      if (isLoggedIn === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding'); // show onboarding every time if not logged in
      }
    };

    checkStatus();
  }, []);

  return null;
}



