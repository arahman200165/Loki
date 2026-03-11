import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const chats = [
  { id: "1", name: "Alice", lastMessage: "Hey, are you free later?" },
  { id: "2", name: "Bob", lastMessage: "Let’s push the backend update." },
  {
    id: "3",
    name: "Team Loki",
    lastMessage: "New build is ready for testing.",
  },
  { id: "4", name: "Sarah", lastMessage: "Can you send the design draft?" },
];

export default function ChatScreen() {
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
          } catch (error) {
            console.log("Logout error:", error);
            router.replace("/login");
          }
        },
      },
    ]);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Your Chats</Text>

        <Pressable style={styles.logoutFab} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.chatCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>

            <View style={styles.chatContent}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable style={styles.newChatFab}>
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
  logoutFab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 120,
  },
  chatCard: {
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
  chatContent: {
    flex: 1,
  },
  chatName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  chatMessage: {
    color: "#94a3b8",
    fontSize: 14,
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
