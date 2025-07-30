import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, TouchableOpacity, ScrollView, TextInput, FlatList, Keyboard } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Add a type for host locations
interface HostLocation {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  location_lat: number;
  location_lng: number;
  location_address?: string;
  role: string;
}

export default function MapsScreen() {
  const [hostLocations, setHostLocations] = useState<HostLocation[]>([]);
  const [search, setSearch] = useState('');
  const [filteredHosts, setFilteredHosts] = useState<HostLocation[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHostLocations = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, description, tags, location_lat, location_lng, location_address, role')
        .eq('role', 'host');
      if (!error && data) {
        const filtered = data.filter(h =>
          h.location_lat !== null &&
          h.location_lng !== null &&
          !isNaN(Number(h.location_lat)) &&
          !isNaN(Number(h.location_lng))
        );
        setHostLocations(filtered);
      }
    };
    fetchHostLocations();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredHosts([]);
      setDropdownVisible(false);
      return;
    }
    const lower = (search || '').toLowerCase();
    const matches = hostLocations.filter(h =>
      ((h.name || '').toLowerCase().includes(lower)) ||
      (Array.isArray(h.tags) && h.tags.some(tag => (tag || '').toLowerCase().includes(lower)))
    );
    setFilteredHosts(matches);
    setDropdownVisible(matches.length > 0);
  }, [search, hostLocations]);

  const handleDropdownSelect = (host: HostLocation) => {
    setDropdownVisible(false);
    setSearch(host.name);
    Keyboard.dismiss();
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: Number(host.location_lat),
        longitude: Number(host.location_lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
    
    // Navigate to member-in-portal page
    router.push({
      pathname: '/member-in-portal',
      params: {
        hostId: host.id,
        name: host.name,
        description: host.description || '',
        tags: JSON.stringify(host.tags || []),
      },
    });
  };

  const handleMarkerPress = (host: HostLocation) => {
    router.push({
      pathname: '/member-in-portal',
      params: {
        hostId: host.id,
        name: host.name,
        description: host.description || '',
        tags: JSON.stringify(host.tags || []),
      },
    });
  };

  // Compute initial region based on first host, fallback to Singapore
  const initialRegion = hostLocations.length > 0
    ? {
        latitude: Number(hostLocations[0].location_lat),
        longitude: Number(hostLocations[0].location_lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 1.3521,
        longitude: 103.8198,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <View style={styles.container}>
      {/* Search Bar Overlay */}
      <View style={styles.searchBarContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222B45', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 }}>
          <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: '#fff', fontSize: 16, backgroundColor: 'transparent', paddingVertical: 8 }}
            placeholder="Search host by name or tag..."
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setDropdownVisible(filteredHosts.length > 0)}
          />
          {/* Optional: Add a filter/toggle button on the right */}
          <TouchableOpacity style={{ marginLeft: 8, padding: 4 }}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {dropdownVisible && (
          <View style={styles.dropdown}>
            <FlatList
              data={filteredHosts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleDropdownSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <Text style={styles.dropdownItemTags}>{item.tags.join(', ')}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        zoomEnabled
        scrollEnabled
      >
        {hostLocations.map(host => {
          const lat = Number(host.location_lat);
          const lng = Number(host.location_lng);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={host.id}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor="red"
              title={host.name}
              description={host.location_address || ''}
              onPress={() => handleMarkerPress(host)}
            />
          );
        })}
      </MapView>
      <Text style={{ position: 'absolute', top: 40, alignSelf: 'center', color: 'red', backgroundColor: 'white', padding: 4, borderRadius: 6, fontSize: 12 }}>
        Pins rendered: {hostLocations.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1C2A67',
    fontWeight: 'bold',
  },
  dropdownItemTags: {
    fontSize: 13,
    color: '#1AB09E',
    marginTop: 2,
  },
  map: {
    width: width,
    height: height,
    flex: 1,
  },
  largeRedPin: {
    width: 48,
    height: 48,
  },
  popupOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 280,
    maxHeight: height * 0.6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    padding: 4,
  },
  popupContent: {
    paddingTop: 40,
    alignItems: 'center',
    paddingBottom: 24,
  },
  orgTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C2A67',
    marginBottom: 10,
    textAlign: 'center',
  },
  orgDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  orgAddress: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1AB09E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginTop: 10,
  },
  subscribedButton: {
    backgroundColor: '#2BB34B',
  },
  subscribeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subscribedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#E6F7F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#1AB09E',
    fontWeight: '600',
    fontSize: 13,
  },
});



