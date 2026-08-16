import { View, Text, Pressable, StyleSheet } from "react-native";

// The shape of data this component expects to receive
export interface ChatRowProps {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  onPress: () => void;
}

// A single row in the chat list — avatar, name, last message, unread badge.
export default function ChatRow({ name, lastMessage, unreadCount, onPress }: ChatRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {/* Circle avatar showing the first letter of the contact's name */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Name and last message preview */}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>

      {/* Red badge showing unread count — only visible when unreadCount > 0 */}
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  preview: {
    color: "#94a3b8",
    fontSize: 14,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
