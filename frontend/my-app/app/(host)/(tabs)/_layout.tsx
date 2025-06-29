/*import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/assets/colorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  /*const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}*/
import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function HostTabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          paddingBottom: 20,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#00b2a9',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          paddingHorizontal: 12,
        },
      }}
    >
      <Tabs.Screen 
        name="portal" 
        options={{
          title: 'Portal',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/homee.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.6,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="announcements" 
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/megaphone.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.6,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="calendar" 
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/calendar.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.6,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="chats" 
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/chat.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.6,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
