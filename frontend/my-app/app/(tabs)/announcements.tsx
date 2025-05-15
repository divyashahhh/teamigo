import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform
} from 'react-native';

export default function AnnouncementsScreen() {
  const [activeTab, setActiveTab] = useState('My Communities');
  const [filter1, setFilter1] = useState('Active');
  const [filter2, setFilter2] = useState('Most Recent');

  const tabs = ['My Communities', 'Following', 'Nearby'];
  const filter1Options = ['Active', 'Past', 'Public', 'Private'];
  const filter2Options = ['Most Recent', 'Most Nearby', 'Most Urgent'];

  const renderFilter = (label: string, current: string, setCurrent: Function, options: string[]) => (
    <View style={styles.filterBox}>
      <Pressable onPress={() => {
        const index = options.indexOf(current);
        setCurrent(options[(index + 1) % options.length]);
      }}>
        <Text style={styles.filterText}>{label}: {current}</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {renderFilter('Show', filter1, setFilter1, filter1Options)}
        {renderFilter('Sort', filter2, setFilter2, filter2Options)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 Announcement Title</Text>
        <Text style={styles.cardBody}>Details about your announcement go here.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 Announcement Title</Text>
        <Text style={styles.cardBody}>Details about your announcement go here.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 Announcement Title</Text>
        <Text style={styles.cardBody}>Details about your announcement go here.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 20,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#555',
  },
});