import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import {
  loadAuthFlowState,
  saveAuthFlowPatch,
} from "../../src/auth/flowStore";
import { generateEd25519KeyPair } from "../../src/auth/crypto";

type RecoveryStartResponse = {
  recovery_session_id: string;
  recovery_challenge: string;
};

export default function VerifyingRecoveryScreen() {
  const [error, setError] = useState<string | null>(null);

  const begin = async () => {
    setError(null);
    try {
      const state = await loadAuthFlowState();
      if (!state.accountLocator) {
        throw new Error("That recovery kit could not be verified.");
      }

      const newDeviceKeys = await generateEd25519KeyPair();
      const response = await apiPost<RecoveryStartResponse>("/v1/auth/recovery/start", {
        account_locator: state.accountLocator,
        new_device_public_identity_key: newDeviceKeys.publicJwk,
        new_device_prekeys: [],
        platform: "mobile",
        device_label: "Recovered mobile",
      });

      await saveAuthFlowPatch({
        pendingDevicePublicJwk: newDeviceKeys.publicJwk,
        pendingDevicePrivateJwk: newDeviceKeys.privateJwk,
        recoverySessionId: response.recovery_session_id,
        recoveryChallenge: response.recovery_challenge,
      });

      router.replace("/(auth)/confirm-restore");
    } catch (caught) {
      if (caught instanceof Error && caught.message) {
        setError(caught.message);
      } else {
        setError("That recovery kit could not be verified.");
      }
    }
  };

  useEffect(() => {
    void begin();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Verifying recovery kit</Text>
      <Text style={authStyles.subtitle}>Checking your recovery information on this device.</Text>

      {!error ? <ActivityIndicator color="#fff" size="large" /> : null}
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      {error ? (
        <>
          <Pressable style={authStyles.primaryButton} onPress={() => void begin()}>
            <Text style={authStyles.primaryText}>Try again</Text>
          </Pressable>
          <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
            <Text style={authStyles.secondaryText}>Back</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
