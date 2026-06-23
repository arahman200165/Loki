import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  validatePublicId,
  normalizePublicId,
} from "@loki/shared";
import { apiPost } from "../../lib/apiClient";
import type { ClaimPublicIdResponse } from "@loki/shared";

const RULES = "8–24 characters · letters and numbers · can include hyphens · must start with a letter";

export default function ChooseId() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  const normalized = normalizePublicId(raw);
  const validation = normalized ? validatePublicId(normalized) : null;

  const inlineError = (() => {
    if (!validation || validation.valid) return null;
    switch (validation.reason) {
      case "too_short": return "Too short — minimum 8 characters.";
      case "too_long": return "Too long — maximum 24 characters.";
      case "reserved": return "That ID is reserved. Pick something else.";
      case "confusable": return "Contains characters that look like others. Use a–z and 0–9 only.";
      case "invalid_format": return "Only a–z, 0–9, and hyphens. Must start with a letter.";
    }
  })();

  const canSubmit = validation?.valid === true && !loading;

  const handleClaim = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      await apiPost<ClaimPublicIdResponse>(
        "/public-id/claim",
        { public_id: normalized },
        token
      );
      // Server always returns 202 submitted — navigate and let id-reveal confirm via /status
      router.replace("/onboarding/id-reveal");
    } catch {
      Alert.alert("Connection error", "Could not reach the server. Try again.");
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
      <Text style={styles.heading}>Choose your Public ID</Text>
      <Text style={styles.subheading}>
        This is how people find and add you on Loki. It{"'"}s the only information
        you share when accepting a contact request.
      </Text>

      <TextInput
        style={[styles.input, inlineError ? styles.inputError : null]}
        placeholder="your-public-id"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={raw}
        onChangeText={setRaw}
        maxLength={26}
      />

      {inlineError ? (
        <Text style={styles.errorText}>{inlineError}</Text>
      ) : normalized && validation?.valid ? (
        <Text style={styles.validText}>Looks good — submitting as @{normalized}</Text>
      ) : (
        <Text style={styles.hintText}>{RULES}</Text>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>No search, no directory</Text>
        <Text style={styles.infoBody}>
          Your Public ID is only useful if you share it directly. Loki has no
          search or public user list. Nobody can find you unless you give them
          your ID yourself.
        </Text>
      </View>

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleClaim}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Claim ID</Text>
        )}
      </Pressable>

      <Pressable style={styles.skipButton} onPress={() => router.replace("/onboarding/id-reveal")}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0f172a" },
  container: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 8 },
  subheading: { fontSize: 15, color: "#94a3b8", lineHeight: 22, marginBottom: 24 },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 16 },
  validText: { color: "#22c55e", fontSize: 13, marginBottom: 16 },
  hintText: { color: "#64748b", fontSize: 13, marginBottom: 16 },
  infoBox: {
    backgroundColor: "#0f2336",
    borderColor: "#1e4a72",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#60a5fa", marginBottom: 6 },
  infoBody: { fontSize: 13, color: "#93c5fd", lineHeight: 19 },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  skipButton: { alignItems: "center", paddingVertical: 12 },
  skipText: { color: "#64748b", fontSize: 14 },
});
