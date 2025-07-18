import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function MemberInPortal() {
  const router = useRouter();
  // Accept params: name, description, tags (as JSON string)
  const { name, description, tags } = useLocalSearchParams();
  const [subscribed, setSubscribed] = useState(false);
  const tagList = tags ? JSON.parse(tags as string) : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{name}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {Array.isArray(tagList) && tagList.length > 0 && (
          <View style={styles.tagsContainer}>
            {tagList.map((tag: string, idx: number) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.subscribeButton, subscribed && styles.subscribedButton]}
          onPress={() => setSubscribed(true)}
          disabled={subscribed}
        >
          <Text style={styles.subscribeText}>{subscribed ? 'SUBSCRIBED!' : 'SUBSCRIBE'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C2A67',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 18,
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
  subscribeButton: {
    backgroundColor: '#1AB09E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  subscribedButton: {
    backgroundColor: '#2BB34B',
  },
  subscribeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  closeText: {
    color: '#333',
    fontSize: 16,
  },
});
