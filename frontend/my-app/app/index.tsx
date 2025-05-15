import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  useEffect(() => {
    const checkStatus = async () => {
    router.replace('/onboarding'); // show onboarding every time if not logged in
    };
    
    checkStatus();
  }, []);

  return null;
}



