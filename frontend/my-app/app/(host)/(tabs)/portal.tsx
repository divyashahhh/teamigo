import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function PortalTab() {
  useEffect(() => {
    // Redirect to the main portal page
    router.replace('../(host)/portal');
  }, []);

  return null;
} 