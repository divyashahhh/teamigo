import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HostAnnouncementsScreen() {
  const [activeTab, setActiveTab] = useState('My Communities');
  const [filter1, setFilter1] = useState('Active');
  const [filter2, setFilter2] = useState('Most Recent');

  const tabs = ['My Communities', 'Following', 'Nearby'];
  const filter1Options = ['Active', 'Past', 'Public', 'Private'];
  const filter2Options = ['Most Recent', 'Most Nearby', 'Most Urgent'];

  const renderFilter = (label: string, current: string, setCurrent: Function, options: string[]) => (
    <TouchableOpacity
      onPress={() => {
        const index = options.indexOf(current);
        setCurrent(options[(index + 1) % options.length]);
      }}
      style={styles.filterButton}
    >
      <Text style={styles.filterText}>{label}: {current}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Tab Switcher */}
        <View style={styles.tabRow}>
          {tabs.map(tab => (
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

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          {renderFilter('Show', filter1, setFilter1, filter1Options)}
          {renderFilter('Sort', filter2, setFilter2, filter2Options)}
        </View>

        {/* Announcement Cards */}
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>📢 Announcement Title {i}</Text>
            <Text style={styles.cardBody}>Details about your announcement go here. You can customize this card per post.</Text>
            <TouchableOpacity style={styles.viewMoreBtn}>
              <Text style={styles.viewMoreText}>View More</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 20,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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

  // Filters
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  filterText: {
    fontSize: 13,
    color: '#2E2A5B',
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  cardBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewMoreBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E2A5B',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  viewMoreText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});