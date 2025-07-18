import { Tabs } from 'expo-router';
import { Image, View, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

const icons = {
  portal: require('@/assets/icons/homee.png'),
  announce: require('@/assets/icons/megaphone.png'),
  maps: require('@/assets/icons/high-five.png'), // renamed from matchup
  merch: require('@/assets/icons/shopping-bag.png'),
  calendar: require('@/assets/icons/calendar.png'),
};

function TabIcon({ focused, source, isCenter = false }: { focused: boolean; source: any; isCenter?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      duration: 250,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const tintColor = isCenter ? '#1AB09E' : focused ? '#fff' : '#888';
  const containerStyle = [
    styles.iconWrapper,
    isCenter && styles.centerIconWrapper,
    focused && isCenter && styles.centerIconFocused,
  ];

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale: scaleAnim }] }]}> 
      <Image source={source} style={[styles.icon, { tintColor }]} />
    </Animated.View>
  );
}

export default function HostTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="portal"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.portal} isCenter={undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.announce} isCenter={undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps" // renamed from "matchup"
        options={{
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#1C2A67',
                transform: [{ scale: focused ? 1.1 : 1 }],
                top: -10,
                elevation: 5,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
              }}
            >
              <Image
                source={icons.maps} // renamed from icons.matchup
                style={{
                  width: 28,
                  height: 28,
                  tintColor: '#2BB3B1',
                }}
              />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="merch"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.merch} isCenter={undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.calendar} isCenter={undefined} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#111',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: 80,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  centerIconWrapper: {
    width: 68,
    height: 68,
    backgroundColor: '#fff',
    borderRadius: 34,
    marginTop: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconFocused: {
    shadowColor: '#1AB09E',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  icon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
});
