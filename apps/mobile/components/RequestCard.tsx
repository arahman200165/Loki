import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ContactRequestSummary } from "@loki/shared";
import BlockAction from "../app/components/BlockAction";

interface RequestCardProps {
  request: ContactRequestSummary;
  onAccept: () => void;
  onDeny: () => void;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default function RequestCard({
  request,
  onAccept,
  onDeny,
}: RequestCardProps) {
  const initials = request.sender_public_id.slice(0, 2).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.senderId} numberOfLines={1}>
            {request.sender_public_id}
          </Text>
          {request.first_message ? (
            <Text style={styles.preview} numberOfLines={1}>
              {request.first_message}
            </Text>
          ) : null}
          <Text style={styles.timeAgo}>{timeAgo(request.created_at)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>

        <Pressable style={styles.denyButton} onPress={onDeny}>
          <Text style={styles.denyText}>Deny</Text>
        </Pressable>

        <BlockAction
          targetPublicId={request.sender_public_id}
          requestId={request.id}
          onBlocked={onDeny}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
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
    fontSize: 15,
  },
  meta: {
    flex: 1,
    justifyContent: "center",
  },
  senderId: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  preview: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  timeAgo: {
    color: "#64748b",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  denyButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  denyText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
});
