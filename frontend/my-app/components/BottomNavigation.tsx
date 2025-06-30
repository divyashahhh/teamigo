import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  route: string;
}

interface BottomNavigationProps {
  userRole: 'host' | 'member';
  currentTab?: string;
}

export default function BottomNavigation({ userRole, currentTab = 'home' }: BottomNavigationProps) {
  const memberTabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: require('@/assets/icons/homee.png'), route: '../(member)/(tabs)/index' },
    { id: 'announcements', label: 'Announcements', icon: require('@/assets/icons/megaphone.png'), route: '../(member)/(tabs)/announcements' },
    { id: 'calendar', label: 'Calendar', icon: require('@/assets/icons/calendar.png'), route: '../(member)/(tabs)/calendar' },
    { id: 'chats', label: 'Chats', icon: require('@/assets/icons/chat.png'), route: '../(member)/(tabs)/chats' },
    { id: 'maps', label: 'Maps', icon: require('@/assets/icons/user.png'), route: '../(member)/(tabs)/maps' },
    { id: 'matchup', label: 'Matchup', icon: require('@/assets/icons/3d-cube.png'), route: '../(member)/(tabs)/matchup' },
    { id: 'profile', label: 'Profile', icon: require('@/assets/icons/user.png'), route: '../(member)/(tabs)/profile' },
  ];

  const hostTabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: require('@/assets/icons/homee.png'), route: '../(host)/(tabs)/index' },
    { id: 'announcements', label: 'Announcements', icon: require('@/assets/icons/megaphone.png'), route: '../(host)/(tabs)/announcements' },
    { id: 'calendar', label: 'Calendar', icon: require('@/assets/icons/calendar.png'), route: '../(host)/(tabs)/calendar' },
    { id: 'chats', label: 'Chats', icon: require('@/assets/icons/chat.png'), route: '../(host)/(tabs)/chats' },
    { id: 'portal', label: 'Portal', icon: require('@/assets/icons/homee.png'), route: '../(host)/(tabs)/portal' },
  ];

  const tabs = userRole === 'host' ? hostTabs : memberTabs;

  const handleTabPress = (tab: TabItem) => {
    if (tab.id !== currentTab) {
      router.replace(tab.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, tab.id === currentTab && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
          >
            <Image
              source={tab.icon}
              style={[
                styles.tabIcon,
                tab.id === currentTab && styles.activeTabIcon
              ]}
              resizeMode="contain"
            />
            <Text style={[
              styles.tabLabel,
              tab.id === currentTab && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 20, // Extra padding for safe area
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#00b2a9',
    fontWeight: '600',
  },
}); 