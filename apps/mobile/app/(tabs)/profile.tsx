import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { loadAuthFlowState } from "../../src/auth/flowStore";
import { apiGet } from "../../src/auth/api";

type ContactCodeResponse = { contact_code: string };

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [contactCode, setContactCode] = useState<string>("loki:----");

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setDisplayName(state.displayName);
      if (!state.authToken) {
        return;
      }
      try {
        const data = await apiGet<ContactCodeResponse>("/v1/profile/contact-code", state.authToken);
        setContactCode(data.contact_code);
      } catch {
        setContactCode("loki:----");
      }
    };
    void run();
  }, []);

  const profileName = displayName?.trim() ? displayName.trim() : "Loki User";
  const avatarInitial = useMemo(() => {
    const first = profileName.trim().charAt(0);
    return first ? first.toUpperCase() : "L";
  }, [profileName]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarInitial}</Text>
      </View>

      <Text style={styles.name}>{profileName}</Text>
      <Text style={styles.email}>Privacy-first account</Text>
      <Text style={styles.codeLabel}>Private ID</Text>
      <Text style={styles.codeValue}>{contactCode}</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push("/settings/devices")}>
        <Text style={styles.secondaryButtonText}>Devices</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push("/settings/app-lock")}>
        <Text style={styles.secondaryButtonText}>App lock</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  email: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 10,
  },
  codeLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  codeValue: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 16,
  },
});
