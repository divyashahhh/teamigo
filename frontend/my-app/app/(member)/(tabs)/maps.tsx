import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, Dimensions, Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/utils/supabaseClient';

const { width, height } = Dimensions.get('window');

export default function MemberMapsScreen() {
  const [search, setSearch] = useState('');
  const [portals, setPortals] = useState<any[]>([]);
  const [filteredPortals, setFilteredPortals] = useState<any[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<any | null>(null);
  const [region, setRegion] = useState<any>(null);

  useEffect(() => {
    fetchPortals();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredPortals(portals);
    } else {
      setFilteredPortals(
        portals.filter(p =>
          p.name && p.name.toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
  }, [search, portals]);

  const fetchPortals = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, description, location_lat, location_lng, location_address, tags, profile_image_url')
      .eq('role', 'host');
    if (!error && data) setPortals(data);
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      // Default region (e.g. center of a city)
      setRegion({
        latitude: 1.3521,
        longitude: 103.8198,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
  }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a portal by name..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredPortals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.portalItem} onPress={() => setSelectedPortal(item)}>
            <Text style={styles.portalName}>{item.name}</Text>
            <Text style={styles.portalDesc}>{item.description}</Text>
            <Text style={styles.portalAddress}>{item.location_address}</Text>
          </Pressable>
        )}
        style={styles.list}
      />
      {region && (
        <MapView style={styles.map} region={region} showsUserLocation>
          {filteredPortals
            .filter(portal => portal.location_lat && portal.location_lng)
            .map(portal => (
          <Marker
                key={portal.id}
                coordinate={{ latitude: portal.location_lat, longitude: portal.location_lng }}
                title={portal.name}
                description={portal.description}
                onPress={() => setSelectedPortal(portal)}
          />
            ))}
      </MapView>
      )}
      {/* Portal details modal or card can go here if selectedPortal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  searchBar: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  list: {
    maxHeight: 200,
    marginHorizontal: 16,
  },
  portalItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  portalName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#00b2a9',
  },
  portalDesc: {
    color: '#333',
    fontSize: 14,
  },
  portalAddress: {
    color: '#666',
    fontSize: 12,
  },
  map: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
  },
}); 