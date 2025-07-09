import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MerchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Merch page coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 22,
    color: '#00b2a9',
    fontWeight: 'bold',
  },
}); 