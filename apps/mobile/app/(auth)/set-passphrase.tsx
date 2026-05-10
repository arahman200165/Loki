import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch, type LockMode } from "../../src/auth/flowStore";
import { setDuressPassword, setLocalPassword } from "../../src/auth/localLock";

const resolveTargetLockMode = (value?: string | string[]): LockMode => {
  const mode = Array.isArray(value) ? value[0] : value;
  if (mode === "biometric" || mode === "pin" || mode === "passphrase") {
    return mode;
  }

  return "passphrase";
};

export default function SetPassphraseScreen() {
  const params = useLocalSearchParams<{ lockMode?: string | string[] }>();
  const targetLockMode = resolveTargetLockMode(params.lockMode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [duressPassword, setDuressPasswordInput] = useState("");
  const [confirmDuressPassword, setConfirmDuressPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueWithPassphrase = async () => {
    setError(null);
    const first = password.trim();
    const second = confirmPassword.trim();
    const duressFirst = duressPassword.trim();
    const duressSecond = confirmDuressPassword.trim();
    if (first.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (first !== second) {
      setError("Passwords do not match.");
      return;
    }
    if (duressFirst.length < 6) {
      setError("Duress password must be at least 6 characters.");
      return;
    }
    if (duressFirst !== duressSecond) {
      setError("Duress passwords do not match.");
      return;
    }
    if (first === duressFirst) {
      setError("Duress password must be different from app password.");
      return;
    }

    setLoading(true);
    try {
      await setLocalPassword(first);
      await setDuressPassword(duressFirst);

      const state = await loadAuthFlowState();
      await saveAuthFlowPatch({ lockMode: targetLockMode });

      if (state.authToken && state.deviceId) {
        await apiPost(
          `/v1/devices/${state.deviceId}/security-state`,
          {
            local_lock_enabled: true,
            lock_mode: targetLockMode,
          },
          state.authToken,
        );
      }

      router.push("/(auth)/display-name");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not set app password right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>
        {targetLockMode === "passphrase" ? "Set app password" : "Set backup app passphrase"}
      </Text>
      <Text style={authStyles.subtitle}>
        {targetLockMode === "passphrase"
          ? "This password stays on this device and will be required when opening the app."
          : "This stays on this device and is used if biometric or device PIN unlock is unavailable."}
      </Text>

      <TextInput
        style={authStyles.input}
        placeholder="New password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(null);
        }}
      />

      <TextInput
        style={authStyles.input}
        placeholder="Confirm password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setError(null);
        }}
      />

      <TextInput
        style={authStyles.input}
        placeholder="Duress password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={duressPassword}
        onChangeText={(text) => {
          setDuressPasswordInput(text);
          setError(null);
        }}
      />

      <TextInput
        style={authStyles.input}
        placeholder="Confirm duress password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={confirmDuressPassword}
        onChangeText={(text) => {
          setConfirmDuressPassword(text);
          setError(null);
        }}
      />

      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable
        style={[authStyles.primaryButton, loading ? { opacity: 0.7 } : null]}
        disabled={loading}
        onPress={() => void continueWithPassphrase()}
      >
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
