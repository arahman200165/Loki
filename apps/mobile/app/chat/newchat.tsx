import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type ChatType = "direct" | "group";

type MockUser = {
  id: string;
  name: string;
  handle: string;
};

const MOCK_USERS: MockUser[] = [
  { id: "1", name: "Alice Johnson", handle: "@alice" },
  { id: "2", name: "Bob Smith", handle: "@bob" },
  { id: "3", name: "Sarah Parker", handle: "@sarah" },
  { id: "4", name: "Team Loki", handle: "@teamloki" },
  { id: "5", name: "Nina Patel", handle: "@nina" },
  { id: "6", name: "Marcus Lee", handle: "@marcus" },
];

export default function NewChatScreen() {
  const [chatType, setChatType] = useState<ChatType>("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isDeviceSpecific, setIsDeviceSpecific] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<MockUser[]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const availableUsers = MOCK_USERS.filter(
      (user) => !selectedUsers.some((selected) => selected.id === user.id),
    );

    if (!query) {
      return availableUsers;
    }

    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.handle.toLowerCase().includes(query),
    );
  }, [searchQuery, selectedUsers]);

  const isGroupChat = chatType === "group";

  const addUser = (user: MockUser) => {
    setSubmitMessage(null);

    if (isGroupChat) {
      setSelectedUsers((current) => [...current, user]);
      return;
    }

    setSelectedUsers([user]);
  };

  const removeSelectedUser = (userId: string) => {
    setSubmitMessage(null);
    setSelectedUsers((current) => current.filter((user) => user.id !== userId));
  };

  const switchChatType = (nextType: ChatType) => {
    setSubmitMessage(null);
    setChatType(nextType);

    if (nextType === "direct") {
      setSelectedUsers((current) => current.slice(0, 1));
    }
  };

  const handleCreateChat = () => {
    const hasValidUsers =
      chatType === "direct" ? selectedUsers.length === 1 : selectedUsers.length >= 2;

    if (!hasValidUsers) {
      setSubmitMessage(
        chatType === "direct"
          ? "Select one user to start a direct chat."
          : "Select at least two users to create a group chat.",
      );
      return;
    }

    const payload = {
      type: chatType,
      userIds: selectedUsers.map((user) => user.id),
      groupName: groupName.trim() || undefined,
      isDeviceSpecific,
    };

    setSubmitMessage(`Mock chat created: ${JSON.stringify(payload)}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Start a Chat</Text>
      <Text style={styles.subtitle}>
        Choose a chat type, search users, and create the conversation.
      </Text>

      <View style={styles.segmentRow}>
        <Pressable
          style={[
            styles.segmentButton,
            chatType === "direct" && styles.segmentButtonActive,
          ]}
          onPress={() => switchChatType("direct")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              chatType === "direct" && styles.segmentButtonTextActive,
            ]}
          >
            Direct Chat
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            chatType === "group" && styles.segmentButtonActive,
          ]}
          onPress={() => switchChatType("group")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              chatType === "group" && styles.segmentButtonTextActive,
            ]}
          >
            Group Chat
          </Text>
        </Pressable>
      </View>

      {isGroupChat ? (
        <View style={styles.section}>
          <Text style={styles.label}>Group name</Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Optional group name"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.label}>Search users</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or handle"
          placeholderTextColor="#64748b"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Selected users</Text>
        {selectedUsers.length === 0 ? (
          <Text style={styles.helperText}>
            {isGroupChat
              ? "Select at least two users."
              : "Select one user for a direct chat."}
          </Text>
        ) : (
          <View style={styles.chipWrap}>
            {selectedUsers.map((user) => (
              <View key={user.id} style={styles.userChip}>
                <Text style={styles.userChipText}>{user.name}</Text>
                <Pressable onPress={() => removeSelectedUser(user.id)}>
                  <Ionicons name="close" size={16} color="#dbeafe" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Results</Text>
        <View style={styles.resultsCard}>
          {filteredUsers.length === 0 ? (
            <Text style={styles.helperText}>No users match that search.</Text>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.resultRow} onPress={() => addUser(item)}>
                  <View style={styles.resultAvatar}>
                    <Text style={styles.resultAvatarText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.resultTextWrap}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultHandle}>{item.handle}</Text>
                  </View>

                  <Ionicons name="add-circle-outline" size={22} color="#60a5fa" />
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.label}>Device-specific chat</Text>
            <Text style={styles.helperText}>
              Only this device will be able to access this chat.
            </Text>
          </View>

          <Switch
            value={isDeviceSpecific}
            onValueChange={setIsDeviceSpecific}
            trackColor={{ false: "#334155", true: "#60a5fa" }}
            thumbColor={isDeviceSpecific ? "#2563eb" : "#cbd5e1"}
          />
        </View>
      </View>

      {submitMessage ? (
        <Text style={styles.submitMessage}>{submitMessage}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handleCreateChat}>
          <Text style={styles.primaryButtonText}>Create Chat</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#2563eb",
  },
  segmentButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  segmentButtonTextActive: {
    color: "#fff",
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1d4ed8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userChipText: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: "600",
  },
  resultsCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultHandle: {
    color: "#94a3b8",
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: "#1f2937",
    marginHorizontal: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
  },
  toggleTextWrap: {
    flex: 1,
  },
  submitMessage: {
    color: "#93c5fd",
    backgroundColor: "#172554",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    overflow: "hidden",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
