import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';

interface HostData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  subscriber_count: number;
}

export default function MemberInPortal() {
  const router = useRouter();
  const { name, description, tags, hostId } = useLocalSearchParams();
  const [hostData, setHostData] = useState<HostData | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const tagList = tags ? JSON.parse(tags as string) : [];

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to view this portal');
        router.back();
        return;
      }
      setCurrentUserId(user.id);

      // If we have hostId, fetch complete host data
      if (hostId) {
        const { data: hostData, error: hostError } = await supabase
          .from('users')
          .select('id, name, description, tags, subscriber_count')
          .eq('id', hostId)
          .eq('role', 'host')
          .single();

        if (hostError) {
          console.error('Error fetching host data:', hostError);
          Alert.alert('Error', 'Could not load portal information');
          router.back();
          return;
        }

        setHostData(hostData);
        
        // Check if current user is already subscribed
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('host_id', hostId)
          .eq('member_id', user.id)
          .single();

        if (!subError && subscription) {
          setSubscribed(true);
        }
      } else {
        // Fallback to params if no hostId (for backward compatibility)
        setHostData({
          id: '',
          name: name as string,
          description: description as string,
          tags: tagList,
          subscriber_count: 0
        });
      }
    } catch (error) {
      console.error('Error initializing page:', error);
      Alert.alert('Error', 'Failed to load portal information');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUserId || !hostData?.id) {
      Alert.alert('Error', 'Unable to subscribe at this time');
      return;
    }

    try {
      setSubscribing(true);

      if (subscribed) {
        // Unsubscribe
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('host_id', hostData.id)
          .eq('member_id', currentUserId);

        if (deleteError) {
          console.error('Error unsubscribing:', deleteError);
          Alert.alert('Error', 'Failed to unsubscribe');
          return;
        }

        setSubscribed(false);
        setHostData(prev => prev ? { ...prev, subscriber_count: prev.subscriber_count - 1 } : null);
        Alert.alert('Success', 'Unsubscribed successfully');
      } else {
        // Subscribe
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            host_id: hostData.id,
            member_id: currentUserId
          });

        if (insertError) {
          console.error('Error subscribing:', insertError);
          if (insertError.code === '23505') { // Unique constraint violation
            Alert.alert('Already Subscribed', 'You are already subscribed to this portal');
          } else {
            Alert.alert('Error', 'Failed to subscribe');
          }
          return;
        }

        setSubscribed(true);
        setHostData(prev => prev ? { ...prev, subscriber_count: prev.subscriber_count + 1 } : null);
        Alert.alert('Success', 'Subscribed successfully!');
      }
    } catch (error) {
      console.error('Error in subscription action:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1AB09E" />
        <Text style={styles.loadingText}>Loading portal...</Text>
      </View>
    );
  }

  const displayName = hostData?.name || name;
  const displayDescription = hostData?.description || description;
  const displayTags = hostData?.tags || tagList;
  const subscriberCount = hostData?.subscriber_count || 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{displayName}</Text>
        {displayDescription ? <Text style={styles.description}>{displayDescription}</Text> : null}
        
        {/* Subscriber Count */}
        <View style={styles.subscriberContainer}>
          <Text style={styles.subscriberCount}>{subscriberCount}</Text>
          <Text style={styles.subscriberLabel}>subscribers</Text>
        </View>

        {Array.isArray(displayTags) && displayTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {displayTags.map((tag: string, idx: number) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.subscribeButton, subscribed && styles.subscribedButton]}
          onPress={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.subscribeText}>
              {subscribed ? 'UNSUBSCRIBE' : 'SUBSCRIBE'}
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  subscriberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscriberCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1AB09E',
    marginRight: 4,
  },
  subscriberLabel: {
    fontSize: 14,
    color: '#666',
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
    minWidth: 140,
    alignItems: 'center',
  },
  subscribedButton: {
    backgroundColor: '#dc3545',
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
