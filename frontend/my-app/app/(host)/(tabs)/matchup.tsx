import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, Linking, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Invite {
  id: number;
  title: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  host: string;
  time: string;
  image: any; 
}

const invites: Invite[] = [
  {
    id: 1,
    title: 'Basketball Meetup',
    location: 'East Coast Court',
    coordinates: {
      latitude: 1.3039,
      longitude: 103.9144
    },
    host: 'Marcus',
    time: '7:00 PM – 8:30 PM',
    image: require('@/assets/images/basketball.png'),
  },
  {
    id: 2,
    title: 'Startup Pitch Night',
    location: 'Bugis Hub',
    coordinates: {
      latitude: 1.3008,
      longitude: 103.8555
    },
    host: 'Arya & Jin',
    time: '5:00 PM – 7:00 PM',
    image: require('@/assets/images/startup.png'),
  },
  {
    id: 3,
    title: 'Beach Volleyball',
    location: 'Sentosa Beach',
    coordinates: {
      latitude: 1.2494,
      longitude: 103.8303
    },
    host: 'Clara',
    time: '4:00 PM – 6:00 PM',
    image: require('@/assets/images/volleyball.png'),
  }
];

export default function MatchupScreen() {
  const [activeTab, setActiveTab] = useState('Invites');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
      } catch (error) {
        setErrorMsg('Error getting location');
        Alert.alert('Error', 'Could not get your location');
      }
    })();
  }, []);

  const openInMaps = (invite: Invite) => {
    // For iOS, we'll use Apple Maps
    const { latitude, longitude } = invite.coordinates;
    const label = encodeURIComponent(invite.location);
    const url = `http://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Maps app is not installed');
      }
    });
  };

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
                <View style={styles.locationContainer}>
                  <Text style={styles.details}>
                    {invite.location} • Hosted by {invite.host}
                  </Text>
                  <TouchableOpacity
                    onPress={() => openInMaps(invite)}
                    style={styles.mapButton}
                  >
                    <Ionicons name="map-outline" size={20} color="#00b2a9" />
                  </TouchableOpacity>
                </View>
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
          <MapView
            style={styles.map}
            showsUserLocation
            showsPointsOfInterest
            showsCompass
            showsScale
            showsBuildings
            showsTraffic={false}
            mapType="standard"
            initialRegion={{
              latitude: location?.coords.latitude || 1.3521, // Singapore coordinates as default
              longitude: location?.coords.longitude || 103.8198,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {invites.map(invite => (
              <Marker
                key={invite.id}
                coordinate={invite.coordinates}
                title={invite.title}
                description={invite.location}
              >
                <Callout onPress={() => openInMaps(invite)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{invite.title}</Text>
                    <Text style={styles.calloutDetails}>{invite.location}</Text>
                    <Text style={styles.calloutTime}>{invite.time}</Text>
                    <Text style={styles.calloutLink}>Open in Maps →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  // Tab Styling
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
    fontSize: 15,
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Invites Styling
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mapButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  details: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  chatButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E2A5B',
    borderRadius: 24,
    padding: 10,
  },
  chatIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  // Map Tab
  mapTab: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDetails: {
    fontSize: 12,
    color: '#666',
  },
  calloutTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  calloutLink: {
    fontSize: 12,
    color: '#00b2a9',
    marginTop: 4,
    fontWeight: '500',
  },
}); 