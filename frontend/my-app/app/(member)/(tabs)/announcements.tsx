import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';
import { useMemberFeed } from '@/hooks/useMemberFeed';

export default function MemberAnnouncements() {
  const { hostIds, loading: subsLoading, error: subsError } = useMemberSubscriptions();
  const { data: announcements, loading, error } = useMemberFeed('announcements', hostIds);

  if (subsLoading || loading) {
    return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  }
  if (subsError || error) {
    return <View style={styles.center}><Text style={styles.error}>{subsError || error}</Text></View>;
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No announcements from your subscriptions yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff4444', fontSize: 16 },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#222' },
  desc: { fontSize: 16, color: '#444', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 8 },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
});