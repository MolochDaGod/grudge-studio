/**
 * Peer-to-Peer Messaging System
 * Real-time messaging between GrudgeAccounts using Puter KV queues
 */

import { isPuterAvailable, getPuter } from './puter';

export interface P2PMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'trade_request' | 'party_invite' | 'guild_invite' | 'system';
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  participantId: string;
  participantName: string;
  lastMessage: P2PMessage | null;
  unreadCount: number;
  updatedAt: string;
}

const INBOX_PREFIX = 'grudge_inbox_';
const CONVERSATIONS_PREFIX = 'grudge_convos_';
const SENT_PREFIX = 'grudge_sent_';

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function sendMessage(
  senderId: string,
  senderName: string,
  recipientId: string,
  content: string,
  type: P2PMessage['type'] = 'text',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; message?: P2PMessage; error?: string }> {
  const msg: P2PMessage = {
    id: generateMessageId(),
    senderId,
    senderName,
    recipientId,
    content,
    timestamp: new Date().toISOString(),
    read: false,
    type,
    metadata,
  };

  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      
      const inboxKey = `${INBOX_PREFIX}${recipientId}`;
      const inboxStr = await puter.kv.get(inboxKey) as string | null;
      const inbox: P2PMessage[] = inboxStr ? JSON.parse(inboxStr) : [];
      inbox.push(msg);
      await puter.kv.set(inboxKey, JSON.stringify(inbox));

      const sentKey = `${SENT_PREFIX}${senderId}`;
      const sentStr = await puter.kv.get(sentKey) as string | null;
      const sent: P2PMessage[] = sentStr ? JSON.parse(sentStr) : [];
      sent.push(msg);
      await puter.kv.set(sentKey, JSON.stringify(sent));

      await updateConversation(senderId, recipientId, senderName, msg);
      await updateConversation(recipientId, senderId, senderName, msg);

      return { success: true, message: msg };
    } catch (error) {
      console.error('Failed to send message via Puter:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  const inboxKey = `${INBOX_PREFIX}${recipientId}`;
  const inbox: P2PMessage[] = JSON.parse(localStorage.getItem(inboxKey) || '[]');
  inbox.push(msg);
  localStorage.setItem(inboxKey, JSON.stringify(inbox));

  const sentKey = `${SENT_PREFIX}${senderId}`;
  const sent: P2PMessage[] = JSON.parse(localStorage.getItem(sentKey) || '[]');
  sent.push(msg);
  localStorage.setItem(sentKey, JSON.stringify(sent));

  return { success: true, message: msg };
}

async function updateConversation(
  userId: string,
  partnerId: string,
  partnerName: string,
  message: P2PMessage
): Promise<void> {
  const convosKey = `${CONVERSATIONS_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const convosStr = await puter.kv.get(convosKey) as string | null;
      const convos: Record<string, Conversation> = convosStr ? JSON.parse(convosStr) : {};
      
      const existing = convos[partnerId];
      const isUnread = message.recipientId === userId && !message.read;
      
      convos[partnerId] = {
        participantId: partnerId,
        participantName: partnerName,
        lastMessage: message,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
        updatedAt: message.timestamp,
      };
      
      await puter.kv.set(convosKey, JSON.stringify(convos));
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  } else {
    const convos: Record<string, Conversation> = JSON.parse(localStorage.getItem(convosKey) || '{}');
    const existing = convos[partnerId];
    const isUnread = message.recipientId === userId && !message.read;
    
    convos[partnerId] = {
      participantId: partnerId,
      participantName: partnerName,
      lastMessage: message,
      unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
      updatedAt: message.timestamp,
    };
    
    localStorage.setItem(convosKey, JSON.stringify(convos));
  }
}

export async function getInbox(userId: string): Promise<P2PMessage[]> {
  const inboxKey = `${INBOX_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const inboxStr = await puter.kv.get(inboxKey) as string | null;
      return inboxStr ? JSON.parse(inboxStr) : [];
    } catch (error) {
      console.error('Failed to get inbox from Puter:', error);
      return [];
    }
  }
  
  return JSON.parse(localStorage.getItem(inboxKey) || '[]');
}

export async function getSentMessages(userId: string): Promise<P2PMessage[]> {
  const sentKey = `${SENT_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const sentStr = await puter.kv.get(sentKey) as string | null;
      return sentStr ? JSON.parse(sentStr) : [];
    } catch (error) {
      console.error('Failed to get sent messages from Puter:', error);
      return [];
    }
  }
  
  return JSON.parse(localStorage.getItem(sentKey) || '[]');
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const convosKey = `${CONVERSATIONS_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const convosStr = await puter.kv.get(convosKey) as string | null;
      const convos: Record<string, Conversation> = convosStr ? JSON.parse(convosStr) : {};
      return Object.values(convos).sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get conversations from Puter:', error);
      return [];
    }
  }
  
  const convos: Record<string, Conversation> = JSON.parse(localStorage.getItem(convosKey) || '{}');
  return Object.values(convos).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getConversationMessages(
  userId: string,
  partnerId: string
): Promise<P2PMessage[]> {
  const inbox = await getInbox(userId);
  const sent = await getSentMessages(userId);
  
  const conversationMessages = [
    ...inbox.filter(m => m.senderId === partnerId),
    ...sent.filter(m => m.recipientId === partnerId),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  return conversationMessages;
}

export async function markAsRead(userId: string, messageIds: string[]): Promise<void> {
  const inboxKey = `${INBOX_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const inboxStr = await puter.kv.get(inboxKey) as string | null;
      const inbox: P2PMessage[] = inboxStr ? JSON.parse(inboxStr) : [];
      const updated = inbox.map(m => 
        messageIds.includes(m.id) ? { ...m, read: true } : m
      );
      await puter.kv.set(inboxKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
    return;
  }
  
  const inbox: P2PMessage[] = JSON.parse(localStorage.getItem(inboxKey) || '[]');
  const updated = inbox.map(m => 
    messageIds.includes(m.id) ? { ...m, read: true } : m
  );
  localStorage.setItem(inboxKey, JSON.stringify(updated));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const inbox = await getInbox(userId);
  return inbox.filter(m => !m.read).length;
}

export async function deleteMessage(userId: string, messageId: string): Promise<void> {
  const inboxKey = `${INBOX_PREFIX}${userId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const inboxStr = await puter.kv.get(inboxKey) as string | null;
      const inbox: P2PMessage[] = inboxStr ? JSON.parse(inboxStr) : [];
      const updated = inbox.filter(m => m.id !== messageId);
      await puter.kv.set(inboxKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    return;
  }
  
  const inbox: P2PMessage[] = JSON.parse(localStorage.getItem(inboxKey) || '[]');
  const updated = inbox.filter(m => m.id !== messageId);
  localStorage.setItem(inboxKey, JSON.stringify(updated));
}

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
