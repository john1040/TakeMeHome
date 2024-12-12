import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ChatPreview {
  recipientId: string;
  recipientUsername: string;
  lastMessage: string;
  lastMessageTime: string;
}

export default function Chats() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const { session } = useAuth();
  const router = useRouter();

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
    
    messages?.forEach(message => {
      const isUserSender = message.sender_id === session.user.id;
      const otherUserId = isUserSender ? message.recipient_id : message.sender_id;
      const otherUsername = isUserSender ? message.recipient.username : message.sender.username;

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
        <View style={styles.chatInfo}>
          <ThemedText style={styles.username}>{item.recipientUsername}</ThemedText>
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
        </View>
        <ThemedText style={styles.time}>
          {new Date(item.lastMessageTime).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>Chats</ThemedText>
      </ThemedView>
      
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.recipientId}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatInfo: {
    flex: 1,
    marginRight: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
}); 