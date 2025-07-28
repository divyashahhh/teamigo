import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { chatService } from '../../services/chatService';

interface HostData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  subscriber_count: number;
  profile_image_url?: string;
  background_image_url?: string;
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
          .select('id, name, description, tags, subscriber_count, profile_image_url, background_image_url')
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

  const handleStartChat = async () => {
    if (!currentUserId || !hostData?.id) {
      Alert.alert('Error', 'Unable to start chat at this time');
      return;
    }

    try {
      // Create or get conversation with the host
      const conversationId = await chatService.createOrGetConversation(hostData.id);
      
      // Navigate to the member chat thread
      router.push({
        pathname: '/(member)/chat_thread' as any,
        params: { conversationId }
      });
    } catch (err) {
      console.error('Error starting chat:', err);
      Alert.alert('Error', 'Failed to start chat');
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
    <View style={{ flex: 1 }}>
      <Image
        source={hostData?.background_image_url ? { uri: hostData.background_image_url } : require('@/assets/images/image.png')}
        style={{ width: '100%', height: 320, position: 'absolute' }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', width: '100%', height: 320 }}
      />
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingTop: 180 }}>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderRadius: 28,
          padding: 24,
          width: '100%',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Image
            source={hostData?.profile_image_url ? { uri: hostData.profile_image_url } : require('@/assets/images/image.png')}
            style={{ width: 90, height: 90, borderRadius: 24, marginTop: -70, borderWidth: 4, borderColor: '#fff', backgroundColor: '#eee' }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222B45', marginTop: 12, textAlign: 'center' }}>{displayName}</Text>
          {displayDescription ? <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 10, textAlign: 'center' }}>{displayDescription}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backgroundColor: '#F3F6FD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00b2a9', marginRight: 4 }}>{subscriberCount}</Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>subscribers</Text>
          </View>
          {Array.isArray(displayTags) && displayTags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18, gap: 8 }}>
              {displayTags.map((tag: string, idx: number) => (
                <View key={idx} style={{ backgroundColor: '#E6F7F6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, marginBottom: 4 }}>
                  <Text style={{ color: '#00b2a9', fontWeight: '600', fontSize: 13 }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, width: '100%', justifyContent: 'center' }}>
            <TouchableOpacity
              style={{ backgroundColor: subscribed ? '#dc3545' : '#00b2a9', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 22, minWidth: 120, alignItems: 'center' }}
              onPress={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{subscribed ? 'UNSUBSCRIBE' : 'SUBSCRIBE'}</Text>
              )}
            </TouchableOpacity>
        <TouchableOpacity
              style={{ backgroundColor: '#222B45', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 22, minWidth: 60, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={handleStartChat}
        >
              <Image source={require('@/assets/icons/chat.png')} style={{ width: 28, height: 28, tintColor: '#fff' }} />
        </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={{ marginTop: 18, padding: 10, borderRadius: 12, backgroundColor: '#eee' }} onPress={() => router.back()}>
          <Text style={{ color: '#333', fontSize: 16 }}>Close</Text>
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
