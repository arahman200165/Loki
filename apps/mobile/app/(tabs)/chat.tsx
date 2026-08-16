import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PendingContactRequestsResponse } from "@loki/shared";
import { apiGet } from "../../lib/apiClient";
import ChatRow, { type ChatRowProps } from "../components/ChatRow";

// The shape of a single conversation in the inbox.
// lastMessage and unreadCount are placeholders for now —
// task 5.8 (local message DB) will populate these with real values.
type Chat = Omit<ChatRowProps, "onPress">;

export default function ChatScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshScreen = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Fetch pending contact requests count for the banner
      const { ok, data } = await apiGet<PendingContactRequestsResponse>(
        "/contact-request/pending",
        token
      );
      setPendingCount(ok ? data.requests.length : 0);

      // TODO (task 5.8): replace with real conversation list from local message DB.
      // The local DB is built in 5.8 and will provide name, lastMessage, unreadCount
      // for each accepted contact. For now the inbox starts empty.
      setChats([]);
    } catch {
      setPendingCount(0);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      refreshScreen();
    }, [refreshScreen])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["authToken", "authUser"]);
            router.replace("/login");
          } catch {
            router.replace("/login");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header row — title on the left, logout button on the right */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Chats</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Banner shown when there are pending contact requests waiting */}
      {pendingCount > 0 && (
        <Pressable
          style={styles.requestsBanner}
          onPress={() => router.push("/requests")}
        >
          <Text style={styles.requestsBannerText}>
            {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#60a5fa" />
        </Pressable>
      )}

      {/* Loading spinner — shown while data is being fetched */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            chats.length === 0 ? styles.emptyContainer : styles.listContent
          }
          // Empty state — shown when the list has no conversations yet
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={56} color="#334155" />
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to start a new conversation.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatRow
              {...item}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
        />
      )}

      {/* Floating + button — opens the new chat screen */}
      <Pressable
        style={styles.newChatFab}
        onPress={() => router.push("/chat/new-chat")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  requestsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#172554",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e4a72",
  },
  requestsBannerText: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 240,
  },
  newChatFab: {
    position: "absolute",
    right: 16,
    bottom: 48,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
