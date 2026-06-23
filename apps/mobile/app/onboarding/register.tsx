import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PasswordInput from "../../components/PasswordInput";
import { apiPost } from "../../lib/apiClient";
import type { RegisterResponse } from "@loki/shared";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Missing fields", "Enter a username and password.");
      return;
    }

    try {
      setLoading(true);
      const { ok, data } = await apiPost<RegisterResponse>(
        "/auth/register",
        { username: username.trim(), password }
      );

      if (!ok) {
        Alert.alert(
          "Registration failed",
          (data as { message?: string }).message ?? "Something went wrong."
        );
        return;
      }

      await AsyncStorage.multiSet([
        ["authToken", data.token],
        ["authUser", JSON.stringify(data.user)],
      ]);

      router.replace("/onboarding/choose-id");
    } catch {
      Alert.alert("Connection error", "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>{"Choose a username you'll use to identify yourself."}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />

      <PasswordInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password (12 characters minimum)"
      />

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Before you create your account</Text>
        <Text style={styles.warningBody}>
          Loki has no password reset. If you forget your password and did not
          set up recovery, your account cannot be restored. There is no back door.
        </Text>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create account</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  warning: {
    backgroundColor: "#1e1a0e",
    borderColor: "#b45309",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fbbf24",
    marginBottom: 6,
  },
  warningBody: {
    fontSize: 13,
    color: "#fcd34d",
    lineHeight: 19,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
