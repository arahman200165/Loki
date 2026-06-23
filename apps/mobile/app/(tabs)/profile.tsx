import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePublicId } from "../../hooks/usePublicId";

export default function ProfileScreen() {
  const { id, loading, fetchStatus } = usePublicId();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["authToken", "authUser"]);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>L</Text>
      </View>

      <View style={styles.idSection}>
        <Text style={styles.idLabel}>Public ID</Text>
        {loading ? (
          <ActivityIndicator color="#60a5fa" style={{ marginTop: 4 }} />
        ) : id ? (
          <Text style={styles.idValue}>{id}</Text>
        ) : (
          <Text style={styles.noId}>Not set — tap below to choose</Text>
        )}
      </View>

      <Pressable
        style={styles.manageButton}
        onPress={() => router.push("/profile/manage-id")}
      >
        <Text style={styles.manageText}>
          {id ? "Manage Public ID" : "Choose a Public ID"}
        </Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    alignItems: "center",
    paddingTop: 60,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  idSection: { alignItems: "center", marginBottom: 24 },
  idLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  idValue: { fontSize: 20, fontWeight: "700", color: "#60a5fa" },
  noId: { fontSize: 14, color: "#64748b" },
  manageButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  manageText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});
