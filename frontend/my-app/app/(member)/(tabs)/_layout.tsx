import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function MemberTabsLayout() {
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
        name="profile" 
        options={{
          title: 'Profile',
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
      <Tabs.Screen
        name="maps" 
        options={{
          title: 'Maps',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/user.png')}
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
        name="matchup" 
        options={{
          title: 'Matchup',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/icons/3d-cube.png')}
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