import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MessageCircle } from 'lucide-react-native';

interface DatabaseMessage {
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender: {
    username: string;
  };
  recipient: {
    username: string;
  };
}

interface ChatPreview {
  recipientId: string;
  recipientUsername: string;
  lastMessage: string;
  lastMessageTime: string;
}

export default function Chats() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchChats();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${session.user.id},recipient_id=eq.${session.user.id}`,
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const fetchChats = async () => {
    setIsLoading(true);
    if (!session?.user?.id) return;

    // Get all unique conversations for the current user
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        content,
        created_at,
        sender_id,
        recipient_id,
        sender:profiles!fk_sender_profile(username),
        recipient:profiles!fk_recipient_profile(username)
      `)
      .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

    // Process messages to get unique conversations with latest message
    const conversationsMap = new Map<string, ChatPreview>();
    
    messages?.forEach((message: any) => {
      const isUserSender = message.sender_id === session.user.id;
      const otherUserId = isUserSender ? message.recipient_id : message.sender_id;
      
      const otherUsername = isUserSender
        ? message.recipient?.username || 'Unknown User'
        : message.sender?.username || 'Unknown User';

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          recipientId: otherUserId,
          recipientUsername: otherUsername,
          lastMessage: message.content,
          lastMessageTime: message.created_at,
        });
      }
    });

    setChats(Array.from(conversationsMap.values()));
    setIsLoading(false);
  };

  const handleChatPress = (chat: ChatPreview) => {
    router.push({
      pathname: '/(app)/chat',
      params: {
        recipientId: chat.recipientId,
        recipientUsername: chat.recipientUsername,
      },
    });
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity onPress={() => handleChatPress(item)}>
      <ThemedView style={styles.chatItem}>
        <ThemedView style={styles.avatarContainer}>
          <ThemedText style={styles.avatarText}>
            {item.recipientUsername[0].toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.chatInfo}>
          <ThemedText style={styles.username}>{item.recipientUsername}</ThemedText>
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.time}>
          {new Date(item.lastMessageTime).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>聊天室</ThemedText>
      </ThemedView>
      
      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
        </ThemedView>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.recipientId}
          style={styles.chatList}
          contentContainerStyle={[
            styles.chatListContent,
            chats.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={() => (
            <ThemedView style={styles.emptyContainer}>
              <MessageCircle size={48} color={Colors[colorScheme ?? 'light'].primary} />
              <ThemedText style={styles.emptyText}>No conversations yet</ThemedText>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyListContent: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + '40',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  chatInfo: {
    flex: 1,
    marginRight: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.7,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
}); 