import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';
import { useMemberFeed } from '@/hooks/useMemberFeed';

export default function MemberMerch() {
  const { hostIds, loading: subsLoading, error: subsError } = useMemberSubscriptions();
  const { data: merch, loading, error } = useMemberFeed('merchandise', hostIds);

  if (subsLoading || loading) {
    return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  }
  if (subsError || error) {
    return <View style={styles.center}><Text style={styles.error}>{subsError || error}</Text></View>;
  }

  return (
    <FlatList
      data={merch}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}><Text>🛍️</Text></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>${item.price?.toFixed(2) ?? ''}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No merch from your subscriptions yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff4444', fontSize: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#222' },
  price: { fontSize: 16, color: '#00b2a9', marginTop: 4 },
  desc: { fontSize: 16, color: '#444', marginTop: 4 },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
}); 