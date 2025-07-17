import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapsScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 20.5937, // Center of India
          longitude: 78.9629,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        showsUserLocation
        showsMyLocationButton
        zoomEnabled
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
    flex: 1,
  },
});



