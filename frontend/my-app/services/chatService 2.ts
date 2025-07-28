import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from '../utils/firebaseConfig';
import { supabase } from '../utils/supabaseClient';
import { ChatConversation, ChatMessage, ChatUser } from '../types/chat';

class ChatService {
  // Get current user from Supabase
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Create or get a conversation between two users
  async createOrGetConversation(otherUserId: string): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const participants = [currentUser.id, otherUserId].sort();
    const conversationId = participants.join('_');

    // Check if conversation already exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const existingConversation = await getDoc(conversationRef);

    if (!existingConversation.exists()) {
      // Get user details
      const [currentUserDetails, otherUserDetails] = await Promise.all([
        this.getUserDetails(currentUser.id),
        this.getUserDetails(otherUserId)
      ]);

      // Create new conversation
      await setDoc(conversationRef, {
        id: conversationId,
        participants,
        participantDetails: [currentUserDetails, otherUserDetails],
        isGroupChat: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0
      });
    }

    return conversationId;
  }

  // Create a group chat
  async createGroupChat(participantIds: string[], groupName: string, adminId: string): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const conversationId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get all participant details
    const participantDetails = await Promise.all(
      participantIds.map(id => this.getUserDetails(id))
    );

    const conversationRef = doc(db, 'conversations', conversationId);
    await setDoc(conversationRef, {
      id: conversationId,
      participants: participantIds,
      participantDetails,
      isGroupChat: true,
      groupName,
      groupAdmin: adminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      unreadCount: 0
    });

    return conversationId;
  }

  // Send a message
  async sendMessage(conversationId: string, content: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const messageData = {
      senderId: currentUser.id,
      senderName: currentUser.user_metadata?.name || 'Unknown',
      content,
      timestamp: serverTimestamp(),
      type: 'text',
      readBy: [currentUser.id]
    };

    // Add message to conversation
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, messageData);

    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: messageData,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Get user conversations
  async getUserConversations(): Promise<ChatConversation[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as ChatConversation[];
  }

  // Get conversation messages
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
  }

  // Listen to conversation messages in real-time
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (snapshot: any) => {
      const messages = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    });
  }

  // Listen to user conversations in real-time
  async subscribeToConversations(callback: (conversations: ChatConversation[]) => void) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return () => {};

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot: any) => {
      const conversations = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as ChatConversation[];
      callback(conversations);
    });
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return;

    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0
    });
  }

  // Get user details from Supabase
  private async getUserDetails(userId: string): Promise<ChatUser> {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, profile_image_url, is_host')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        id: userId,
        name: 'Unknown User',
        isHost: false
      };
    }

    return {
      id: user.id,
      name: user.name || 'Unknown User',
      profileImage: user.profile_image_url,
      isHost: user.is_host || false
    };
  }

  // Get subscribers for a host
  async getHostSubscribers(hostId: string): Promise<ChatUser[]> {
    console.log('Fetching subscribers for host:', hostId);
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('member_id')
      .eq('host_id', hostId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }

    if (!subscriptions) {
      console.log('No subscriptions found for host:', hostId);
      return [];
    }

    console.log('Found subscriptions:', subscriptions);
    
    const subscriberIds = subscriptions.map(sub => sub.member_id);
    console.log('Subscriber IDs:', subscriberIds);
    
    const subscribers = await Promise.all(
      subscriberIds.map(id => this.getUserDetails(id))
    );

    console.log('Fetched subscribers:', subscribers);
    return subscribers;
  }

  // Get hosts that a member is subscribed to
  async getMemberSubscribedHosts(memberId: string): Promise<ChatUser[]> {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('host_id')
      .eq('member_id', memberId);

    if (error || !subscriptions) return [];

    const hostIds = subscriptions.map(sub => sub.host_id);
    const hosts = await Promise.all(
      hostIds.map(id => this.getUserDetails(id))
    );

    return hosts;
  }
}

export const chatService = new ChatService();
export default chatService; 