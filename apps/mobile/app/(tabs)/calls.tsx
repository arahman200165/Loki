import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { CallHistoryEntry, listCallHistory } from "../../services/callHistoryStore";

const MISSED_OUTCOMES = ["missed", "declined", "failed"];

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function subtitleFor(entry: CallHistoryEntry): string {
  if (entry.outcome === "missed") return "Missed";
  if (entry.outcome === "declined") return entry.direction === "outgoing" ? "Declined" : "You declined";
  if (entry.outcome === "failed") return "Call failed";
  return entry.durationSeconds != null ? formatDuration(entry.durationSeconds) : "Completed";
}

export default function CallsScreen() {
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      listCallHistory().then(setHistory);
    }, [])
  );

  const callBack = (entry: CallHistoryEntry, type: "audio" | "video") => {
    if (entry.memberPublicIds && entry.memberPublicIds.length > 0) {
      router.push({
        pathname: "/call/outgoing",
        params: { type, displayName: entry.peerLabel, memberPublicIds: entry.memberPublicIds.join(",") },
      });
    } else if (entry.recipientPublicId) {
      router.push({
        pathname: "/call/outgoing",
        params: { type, displayName: entry.peerLabel, recipientPublicId: entry.recipientPublicId },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calls</Text>

      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.callId}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isMissedForMe = item.direction === "incoming" && MISSED_OUTCOMES.includes(item.outcome);
          return (
            <Pressable style={styles.row} onPress={() => callBack(item, item.type)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.peerLabel.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.peerLabel}
                </Text>
                <View style={styles.subtitleRow}>
                  <Ionicons
                    name={item.direction === "outgoing" ? "arrow-up-outline" : "arrow-down-outline"}
                    size={13}
                    color={isMissedForMe ? "#f87171" : "#64748b"}
                  />
                  <Text style={[styles.subtitle, isMissedForMe && styles.missedText]}>
                    {subtitleFor(item)} · {timeAgo(item.startedAt)}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.callBackButton}
                hitSlop={8}
                onPress={() => callBack(item, item.type)}
              >
                <Ionicons name={item.type === "video" ? "videocam-outline" : "call-outline"} size={20} color="#60a5fa" />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No calls yet</Text>
            <Text style={styles.emptySubtitle}>
              Start an audio or video call from any chat and it will show up here.
            </Text>
          </View>
        }
      />
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 18,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
  },
  missedText: {
    color: "#f87171",
  },
  callBackButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
