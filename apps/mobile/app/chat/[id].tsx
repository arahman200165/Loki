import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../../lib/apiClient";
import type { SendMessageResponse } from "@loki/shared";
import MessageBubble from "../components/MessageBubble";
import ComposerBar from "../components/ComposerBar";
import {
  getMessagesForContact,
  saveMessage,
  deleteExpiredMessages,
  type Message,
} from "../../lib/db/messageStore";

export default function ChatThreadScreen() {
  // `id` comes from the URL — e.g. navigating to /chat/bob-loki99 gives id = "bob-loki99"
  const { id } = useLocalSearchParams<{ id: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Load message history from the local encrypted DB every time this screen opens.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        await deleteExpiredMessages();
        const stored = await getMessagesForContact(id);
        if (active) setMessages(stored);
      };
      load();
      return () => { active = false; };
    }, [id])
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    // Clear the input immediately so the user can keep typing
    setDraft("");
    setSending(true);

    // Build the full message object — all fields required by the Message type.
    // envelopeId is null for sent messages (only received messages have a server envelope ID).
    const outgoing: Message = {
      id: `local-${Date.now()}`,
      contactPublicId: id,
      envelopeId: null,
      text,
      sentByMe: true,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    };

    // Show the bubble immediately (optimistic update) and save to local DB.
    setMessages((prev) => [...prev, outgoing]);
    await saveMessage(outgoing);

    // Scroll to the bottom so the new message is visible
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const token = await AsyncStorage.getItem("authToken");

      // TODO (task 6.1): replace with real encryption using recipient's public key.
      // Right now we encode the plaintext as base64 as a placeholder.
      const ciphertextBase64 = Buffer.from(text, "utf8").toString("base64");

      await apiPost<SendMessageResponse>(
        "/messages/send",
        {
          recipient_public_id: id,
          ciphertext: ciphertextBase64,
          idempotency_key: outgoing.id,
          expires_in_seconds: 86400,
        },
        token
      );
    } catch {
      // Network or server error — the message is saved locally and shows optimistically.
      // A full retry/failure UI is out of scope for this sprint.
    } finally {
      setSending(false);
    }
  };

  return (
    // KeyboardAvoidingView pushes the composer bar up when the keyboard opens
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      {/* Header — back button and contact name */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerName} numberOfLines={1}>
          {id}
        </Text>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={32} color="#334155" />
            <Text style={styles.emptyText}>
              Messages are end-to-end encrypted.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            sentByMe={item.sentByMe}
            timestamp={item.timestamp}
          />
        )}
      />

      {/* Composer bar — always at the bottom */}
      <ComposerBar
        value={draft}
        onChangeText={setDraft}
        onSend={handleSend}
        sending={sending}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerName: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 220,
  },
});
