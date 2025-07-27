export interface ChatUser {
  id: string;
  name: string;
  profile_image_url?: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export interface ChatConversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
  other_user?: ChatUser;
}

export interface ChatNotification {
  conversationId: string;
  message: string;
  senderName: string;
  timestamp: Date;
} 