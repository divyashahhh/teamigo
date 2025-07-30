import { supabase } from '../utils/supabaseClient';
import { ChatConversation, ChatMessage, ChatUser } from '../types/chat';

class ChatService {
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async createOrGetConversation(otherUserId: string): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const [participant1, participant2] = [currentUser.id, otherUserId].sort();

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant1_id', participant1)
      .eq('participant2_id', participant2)
      .single();

    if (existingConversation) {
      return existingConversation.id;
    }

    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        participant1_id: participant1,
        participant2_id: participant2
      })
      .select('id')
      .single();

    if (error) throw error;
    return newConversation.id;
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    console.log('Inserting message:', { conversationId, content, senderId: currentUser.id });

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content
        })
        .select();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      console.log('Message inserted successfully:', data);

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      } else {
        console.log('Conversation timestamp updated successfully');
      }
    } catch (err) {
      console.error('Exception in sendMessage:', err);
      throw err;
    }
  }

  async getUserConversations(): Promise<ChatConversation[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    console.log('Getting conversations for user:', currentUser.id);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log('Found conversations:', conversations);

    const processedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant1_id === currentUser.id 
          ? conv.participant2_id 
          : conv.participant1_id;

        console.log('Processing conversation:', conv.id, 'with other user:', otherUserId);

        const { data: otherUser, error: userError } = await supabase
          .from('users')
          .select('id, name, profile_image_url, role')
          .eq('id', otherUserId)
          .single();

        if (userError) {
          console.error('Error fetching user details:', userError);
        }

        const { data: lastMessage, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (messageError && messageError.code !== 'PGRST116') {
          console.error('Error fetching last message:', messageError);
        }

        const result = {
          ...conv,
          other_user: otherUser ? {
            ...otherUser,
            is_host: otherUser.role === 'host'
          } : null,
          last_message: lastMessage
        };

        console.log('Processed conversation:', result);
        return result;
      })
    );

    console.log('Returning processed conversations:', processedConversations);
    return processedConversations;
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        users!messages_sender_id_fkey(name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return messages.map(msg => ({
      ...msg,
      sender_name: msg.users?.name || 'Unknown'
    }));
  }

  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    console.log('Setting up real-time subscription for conversation:', conversationId);
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Real-time message change detected:', payload);
          try {
            const messages = await this.getConversationMessages(conversationId);
            console.log('Fetched updated messages:', messages.length);
            callback(messages);
          } catch (error) {
            console.error('Error in real-time callback:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('Channel subscription timed out');
        }
      });

    return channel;
  }

  async subscribeToConversations(callback: (conversations: ChatConversation[]) => void) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return () => {};

    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async () => {
          const conversations = await this.getUserConversations();
          callback(conversations);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async () => {
          const conversations = await this.getUserConversations();
          callback(conversations);
        }
      )
      .subscribe();
  }
}

export const chatService = new ChatService();
export default chatService; 