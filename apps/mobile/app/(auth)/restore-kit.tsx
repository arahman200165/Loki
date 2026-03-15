import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";

export default function RestoreKitScreen() {
  const [phraseInput, setPhraseInput] = useState("");
  const [accountLocator, setAccountLocator] = useState("");
  const [recoveryPrivateJwk, setRecoveryPrivateJwk] = useState("");
  const [error, setError] = useState<string | null>(null);

  const continueFlow = async () => {
    const normalized = phraseInput.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized.split(" ").filter(Boolean).length < 12) {
      setError("Recovery information not recognized. Check your recovery phrase or file and try again.");
      return;
    }

    const state = await loadAuthFlowState();
    const locator = accountLocator.trim() || state.accountLocator || "";
    const recoveryKey = recoveryPrivateJwk.trim() || state.recoveryPrivateJwk || "";

    if (!locator) {
      setError("Recovery information not recognized. Check your recovery phrase or file and try again.");
      return;
    }
    if (!recoveryKey) {
      setError("Recovery information not recognized. Check your recovery phrase or file and try again.");
      return;
    }

    await saveAuthFlowPatch({
      recoveryPhrase: normalized.split(" "),
      accountLocator: locator,
      recoveryPrivateJwk: recoveryKey,
    });
    router.push("/(auth)/verifying-recovery");
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Restore your account</Text>
      <Text style={authStyles.subtitle}>
        Use your recovery phrase or encrypted recovery file to access your account on this device.
      </Text>
      <Text style={authStyles.cardTitle}>Recovery phrase</Text>
      <Text style={authStyles.helper}>Recovery file</Text>
      <TextInput
        style={authStyles.input}
        placeholder="Account locator (acct_...)"
        placeholderTextColor="#94a3b8"
        value={accountLocator}
        onChangeText={(text) => {
          setAccountLocator(text);
          setError(null);
        }}
      />
      <TextInput
        style={[authStyles.input, { minHeight: 100, textAlignVertical: "top" }]}
        placeholder="Paste recovery phrase"
        placeholderTextColor="#94a3b8"
        multiline
        value={phraseInput}
        onChangeText={(text) => {
          setPhraseInput(text);
          setError(null);
        }}
      />
      <TextInput
        style={[authStyles.input, { minHeight: 120, textAlignVertical: "top" }]}
        placeholder="Recovery private JWK (JSON)"
        placeholderTextColor="#94a3b8"
        multiline
        value={recoveryPrivateJwk}
        onChangeText={(text) => {
          setRecoveryPrivateJwk(text);
          setError(null);
        }}
      />
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable style={authStyles.primaryButton} onPress={() => void continueFlow()}>
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
