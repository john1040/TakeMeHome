import React, { useState, useEffect, useRef } from 'react';
import { TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Send, ArrowLeft } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_username: string;
}

export default function Chat() {
  const { recipientId, recipientUsername } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { session, userProfile } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); // Small delay to ensure layout is complete
    }
  };

  useEffect(() => {
    if (!session?.user?.id || !recipientId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(and(sender_id.eq.${session.user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${session.user.id}))`,
        },
        (payload) => {
          fetchMessages(); // Fetch all messages to ensure we have the sender information
        }
      )
      .subscribe();

    // Fetch existing messages
    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setIsLoading(true);
    if (!session?.user?.id || !recipientId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!fk_sender_profile(username)
      `)
      .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data.map(msg => ({
      ...msg,
      sender_username: msg.sender.username
    })));
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!session?.user?.id || !recipientId || !newMessage.trim()) return;

    // Create the optimistic message
    const optimisticMessage = {
      id: generateUUID(),
      content: newMessage.trim(),
      sender_id: session.user.id,
      recipient_id: recipientId as string,
      created_at: new Date().toISOString(),
      sender_username: userProfile?.username || 'You',
    };

    // Add optimistic message to the UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Actually send the message
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        content: optimisticMessage.content,
        sender_id: session.user.id,
        recipient_id: recipientId,
      });

    if (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      return;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === session?.user?.id;
    
    return (
      <ThemedView
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
        lightColor="transparent"
        darkColor="transparent"
      >
        <ThemedView
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}
        >
          <ThemedText style={[styles.messageUsername, isOwnMessage && styles.ownMessageUsername]}>
            {isOwnMessage ? 'You' : item.sender_username}
          </ThemedText>
          <ThemedText style={styles.messageContent}>
            {item.content}
          </ThemedText>
          <ThemedText style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString()}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
        <ThemedView style={styles.headerContent}>
          <ThemedText style={styles.headerText}>
            {recipientUsername}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
        </ThemedView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 && styles.emptyList
          ]}
          inverted={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          ListEmptyComponent={() => (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No messages yet. Start the conversation!
              </ThemedText>
            </ThemedView>
          )}
        />
      )}

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { color: Colors[colorScheme ?? 'light'].text }
          ]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].text + '80'}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[
            styles.sendButton,
            { opacity: newMessage.trim() ? 1 : 0.5 }
          ]}
          disabled={!newMessage.trim()}
        >
          <Send size={24} color={Colors[colorScheme ?? 'light'].primary} />
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + '40',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  ownMessageBubble: {
    backgroundColor: Colors.light.primary + '20',
  },
  otherMessageBubble: {
    backgroundColor: Colors.light.secondary + '20',
  },
  messageUsername: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  ownMessageUsername: {
    textAlign: 'right',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  ownMessageTime: {
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + '40',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border + '40',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
}); 