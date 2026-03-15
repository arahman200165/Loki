import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

export default function ApproveDeviceScreen() {
  const [label, setLabel] = useState("New device");

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setLabel(state.pendingDeviceLabel ?? "New device");
    };
    void run();
  }, []);

  const submit = async (approve: boolean) => {
    const state = await loadAuthFlowState();
    if (!state.authToken || !state.resolvedLinkSessionId) {
      return;
    }

    if (approve) {
      await apiPost(
        "/v1/devices/link/approve",
        {
          link_session_id: state.resolvedLinkSessionId,
          approval_signature: "trusted-device-approval",
          encrypted_bootstrap_bundle: "encrypted-bootstrap-bundle",
        },
        state.authToken,
      );
      router.replace("/settings/device-added");
      return;
    }

    await apiPost(
      "/v1/devices/link/deny",
      {
        link_session_id: state.resolvedLinkSessionId,
      },
      state.authToken,
    );
    router.back();
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Approve this new device?</Text>
      <Text style={authStyles.subtitle}>{label} wants to join your account.</Text>
      <Text style={authStyles.helper}>Only approve this request if you started it.</Text>
      <Text style={authStyles.helper}>Shared chats will become available on this device.</Text>
      <Text style={authStyles.helper}>Device-specific chats on this device will stay separate.</Text>

      <Pressable style={authStyles.primaryButton} onPress={() => void submit(true)}>
        <Text style={authStyles.primaryText}>Approve device</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => void submit(false)}>
        <Text style={authStyles.secondaryText}>Deny</Text>
      </Pressable>
    </ScrollView>
  );
}
