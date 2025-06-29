import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function ProfileTab() {
  useEffect(() => {
    // Redirect to the main profile page
    router.replace('../(member)/profile');
  }, []);

  return null;
} 