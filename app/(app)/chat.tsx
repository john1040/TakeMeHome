import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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
  const { session, userProfile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

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
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <ThemedView style={styles.messageBubble}>
          <ThemedText style={styles.messageUsername}>
            {isOwnMessage ? 'You' : item.sender_username}
          </ThemedText>
          <ThemedText style={styles.messageContent}>
            {item.content}
          </ThemedText>
          <ThemedText style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString()}
          </ThemedText>
        </ThemedView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>
          Chat with {recipientUsername}
        </ThemedText>
      </ThemedView>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Send size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#e3e3e3',
  },
  messageUsername: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
  },
  messageContent: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
}); 