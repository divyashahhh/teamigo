import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const invites = [
  {
    id: 1,
    title: 'Basketball Meetup',
    location: 'East Coast Court',
    host: 'Marcus',
    time: '7:00 PM – 8:30 PM',
    image: require('@/assets/images/basketball.png'),
  },
  {
    id: 2,
    title: 'Startup Pitch Night',
    location: 'Bugis Hub',
    host: 'Arya & Jin',
    time: '5:00 PM – 7:00 PM',
    image: require('@/assets/images/startup.png'),
  },
  {
    id: 3,
    title: 'Beach Volleyball',
    location: 'Sentosa Beach',
    host: 'Clara',
    time: '4:00 PM – 6:00 PM',
    image: require('@/assets/images/volleyball.png'),
  }
];

export default function MatchupScreen() {
  const [activeTab, setActiveTab] = useState('Invites');
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top Tab Switcher */}
      <View style={styles.tabRow}>
        {['Invites', 'Map'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INVITES TAB */}
      {activeTab === 'Invites' ? (
        <ScrollView style={styles.scroll}>
          {invites.map(invite => (
            <View key={invite.id} style={styles.inviteCard}>
              <Image source={invite.image} style={styles.cardBackground} />
              <View style={styles.overlay}>
                <Text style={styles.title}>{invite.title}</Text>
                <Text style={styles.details}>
                  {invite.location} • Hosted by {invite.host}
                </Text>
                <Text style={styles.time}>Time: {invite.time}</Text>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => router.push('/chats')}
              >
                <Image
                  source={require('@/assets/icons/chat.png')}
                  style={styles.chatIcon}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        // MAP TAB
        <View style={styles.mapTab}>
          <Text style={styles.mapText}>Find the communities closest to you</Text>
          <Image
            source={require('@/assets/images/maps.png')}
            style={styles.mapImage}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    paddingTop: 60, paddingHorizontal: 20,
  },

  // Tab Styling
  tabRow: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginHorizontal: 6,
    backgroundColor: '#eee',
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: '#00b2a9',
  },
  tabText: {
    fontSize: 15, color: '#555',
  },
  activeTabText: {
    color: '#fff', fontWeight: '600',
  },

  // Invites Styling
  scroll: {
    flex: 1,
  },
  inviteCard: {
    height: 180,
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  cardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '700', color: '#000',
  },
  details: {
    fontSize: 14, color: '#444', marginTop: 4,
  },
  time: {
    fontSize: 13, color: '#666', marginTop: 2,
  },
  chatButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E2A5B', // blue from your logo
    borderRadius: 24,
    padding: 10,
  },
  chatIcon: {
    width: 18, height: 18, tintColor: '#fff',
  },

  // Map Tab
  mapTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  mapImage: {
    width: width - 40,
    height: 420,
    borderRadius: 20,
    resizeMode: 'cover',
  },
});



