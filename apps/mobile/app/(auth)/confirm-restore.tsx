import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { signUtf8WithPrivateJwk } from "../../src/auth/crypto";

type RecoveryCompleteResponse = {
  user_id: string;
  device_id: string;
  session_token: string;
};

export default function ConfirmRestoreScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = async () => {
    setError(null);
    setIsRestoring(true);

    try {
      const state = await loadAuthFlowState();
      if (
        !state.recoverySessionId ||
        !state.recoveryPrivateJwk ||
        !state.pendingDevicePrivateJwk ||
        !state.recoveryChallenge
      ) {
        throw new Error("Recovery data is missing. Enter your recovery phrase or file again.");
      }

      const recoveryProof = await signUtf8WithPrivateJwk(
        state.recoveryPrivateJwk,
        state.recoveryChallenge,
      );

      const data = await apiPost<RecoveryCompleteResponse>("/v1/auth/recovery/complete", {
        recovery_session_id: state.recoverySessionId,
        recovery_proof: recoveryProof,
        new_device_activation_signature: "client-generated",
      });

      await saveAuthFlowPatch({
        authToken: data.session_token,
        userId: data.user_id,
        deviceId: data.device_id,
        devicePublicJwk: state.pendingDevicePublicJwk,
        devicePrivateJwk: state.pendingDevicePrivateJwk,
        pendingDevicePublicJwk: null,
        pendingDevicePrivateJwk: null,
        recoverySessionId: null,
        recoveryChallenge: null,
      });

      router.replace("/(auth)/account-restored");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Recovery failed.";
      if (message.includes("RECOVERY_PROOF_INVALID")) {
        setError("That phrase does not match this account. If this is an older account, use recovery file.");
      } else {
        setError(message);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Restore this account on this device?</Text>
      <Text style={authStyles.subtitle}>
        This will add this device to your account and allow access to shared chats. Device-specific
        chats from other devices are not restored automatically.
      </Text>
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}
      <Pressable
        style={[authStyles.primaryButton, isRestoring ? { opacity: 0.7 } : null]}
        onPress={() => void restore()}
        disabled={isRestoring}
      >
        <Text style={authStyles.primaryText}>{isRestoring ? "Restoring..." : "Restore account"}</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}
