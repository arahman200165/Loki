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

const API_BASE_URL = "https://loki-0pfz.onrender.com/api";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "dev-mobile-api-key";
const API_KEY_HEADER_NAME = "x-api-key";

const getApiHeaders = (includeJson = false, token?: string) => {
  const headers: Record<string, string> = {
    [API_KEY_HEADER_NAME]: API_KEY,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);

  const handlePingServer = async () => {
    setPingLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/health`, {
        headers: getApiHeaders(false, authToken ?? undefined),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          "Server Ping Success",
          data.message || "Server is healthy.",
        );
      } else {
        Alert.alert(
          "Server Ping Failed",
          data.message || "Server responded with error.",
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Ping Error",
        "Could not reach server. Check your backend URL.",
      );
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

      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login failed", data.message || "Something went wrong.");
        return;
      }

      if (data?.token) {
        await AsyncStorage.multiSet([
          ["authToken", data.token],
          ["authUser", JSON.stringify(data.user ?? { username })],
        ]);
        setAuthToken(data.token);
      }

      Alert.alert("Success", data.message || "Logged in successfully.");
      router.replace("/(tabs)/chat");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Connection error",
        "Could not connect to the server. Check your backend URL.",
      );
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

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

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

      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.linkText}>Back to Home</Text>
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
