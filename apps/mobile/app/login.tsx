import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PasswordInput from "../components/PasswordInput";
import { apiPost, API_BASE_URL, API_VERSION, buildHeaders } from "../lib/apiClient";
import type { LoginResponse } from "@loki/shared";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);

  const handlePingServer = async () => {
    setPingLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${API_VERSION}/health`, {
        headers: buildHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Server Ping Success", data.message || "Server is healthy.");
      } else {
        Alert.alert("Server Ping Failed", data.message || "Server responded with error.");
      }
    } catch {
      Alert.alert("Ping Error", "Could not reach server. Check your backend URL.");
    } finally {
      setPingLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing fields", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      const { ok, data } = await apiPost<LoginResponse>("/auth/login", {
        username,
        password,
      });

      if (!ok) {
        Alert.alert("Login failed", (data as { message?: string }).message ?? "Something went wrong.");
        return;
      }

      await AsyncStorage.multiSet([
        ["authToken", data.token],
        ["authUser", JSON.stringify(data.user)],
      ]);

      router.replace("/(tabs)/chat");
    } catch {
      Alert.alert("Connection error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>Login to continue to Loki</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <PasswordInput value={password} onChangeText={setPassword} />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.pingButton, pingLoading && styles.buttonDisabled]}
        onPress={handlePingServer}
        disabled={pingLoading}
      >
        {pingLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Ping Server</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/onboarding")}>
        <Text style={styles.linkText}>New here? Create an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    justifyContent: "center",
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 28,
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
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 18,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  pingButton: {
    backgroundColor: "#64748b",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkText: {
    color: "#93c5fd",
    textAlign: "center",
    fontSize: 15,
  },
});
