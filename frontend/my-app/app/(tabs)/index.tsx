import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';
const BACKEND_URL = 'http://192.168.1.116:5002';
export default function HomeTab() {
  const [userName, setUserName] = useState('User');
  const today = new Date().toDateString();

  const isFocused = useIsFocused();

useEffect(() => {
  const fetchName = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };
  fetchName();
}, [isFocused]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {userName.charAt(0).toUpperCase() + userName.slice(1)}
          </Text>
          <Text style={styles.date}>{`Today ${today}`}</Text>
        </View>
        <View style={styles.topIcons}>
          <Pressable onPress={() => router.push('/chats')}>
            <Image
              source={require('@/assets/icons/chat.png')}
              style={styles.topIcon}
            />
          </Pressable>
          <Pressable onPress={() => router.push('/profile')}>
            <Image
              source={require('@/assets/icons/user.png')}
              style={styles.topIcon}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.challengeBox}>
        <Text style={styles.challengeTitle}>Upcoming Events</Text>
        <Text style={styles.challengeSub}>Register by 2pm</Text>
        <View style={styles.avatarsRow}>
          <Image source={require('@/assets/icons/3d-cube.png')} style={styles.icon} />
          <Image source={require('@/assets/icons/3d-cube.png')} style={styles.icon} />
          <Image source={require('@/assets/icons/3d-cube.png')} style={styles.icon} />
          <Text style={styles.moreText}>+4</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <View key={i} style={d === 'Wed' ? styles.activeDate : styles.dateCircle}>
            <Text style={d === 'Wed' ? styles.activeText : styles.dateText}>
              {d}{'\n'}{22 + i}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your Teams</Text>

      <View style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: '#FDE9A0' }]}>
          <Text style={styles.tag}>Medium</Text>
          <Text style={styles.cardTitle}>Youth Developers</Text>
          <Text>25 Nov.{'\n'}14:00–15:00{'\n'}A5 room</Text>
          <Text style={styles.host}>Host: Aryan Gupta</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#CFE6FF' }]}>
          <Text style={styles.tag}>Light</Text>
          <Text style={styles.cardTitle}>East Coast Volleyball</Text>
          <Text>28 Nov.{'\n'}18:00–19:30{'\n'}UTSH1</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: '#E0E0E0' }]}>
          <Text style={styles.tag}>Coming Soon</Text>
          <Text style={styles.cardTitle}>AI Club</Text>
          <Text>Coming Soon</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#E0E0E0' }]}>
          <Text style={styles.tag}>Coming Soon</Text>
          <Text style={styles.cardTitle}>Photography Society</Text>
          <Text>Coming Soon</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    paddingBottom: 140,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700'
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginTop: 4
  },
  topIcons: {
    flexDirection: 'row',
    gap: 14
  },
  topIcon: {
    width: 28,
    height: 28,
    tintColor: '#111'
  },
  challengeBox: {
    backgroundColor: '#E4D5FA',
    borderRadius: 20,
    padding: 16,
    marginTop: 24
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  challengeSub: {
    color: '#444',
    marginVertical: 4
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 6
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600'
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20
  },
  dateCircle: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center'
  },
  activeDate: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center'
  },
  dateText: {
    fontSize: 13,
    textAlign: 'center'
  },
  activeText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    marginHorizontal: 6,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  tag: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  host: {
    marginTop: 8,
    fontSize: 12,
    color: '#444',
  },
});