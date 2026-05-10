import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";

type CompleteLinkResponse = {
  device_id: string;
  user_id: string;
  session_token: string;
};

export default function DeviceApprovedScreen() {
  const complete = async () => {
    const state = await loadAuthFlowState();
    if (!state.linkSessionId || !state.pendingDevicePrivateJwk || !state.pendingDevicePublicJwk) {
      return;
    }

    const data = await apiPost<CompleteLinkResponse>("/v1/devices/link/complete", {
      link_session_id: state.linkSessionId,
      device_activation_signature: "unused_in_current_backend",
    });

    await saveAuthFlowPatch({
      authToken: data.session_token,
      userId: data.user_id,
      deviceId: data.device_id,
      devicePublicJwk: state.pendingDevicePublicJwk,
      devicePrivateJwk: state.pendingDevicePrivateJwk,
      pendingDevicePublicJwk: null,
      pendingDevicePrivateJwk: null,
      linkSessionId: null,
    });

    router.replace("/(auth)/syncing-shared");
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Device approved</Text>
      <Text style={authStyles.subtitle}>
        This device has been added to your account.
      </Text>
      <Text style={authStyles.helper}>Shared chats will sync to this device.</Text>
      <Text style={authStyles.helper}>Device-specific chats from your other devices will not appear here.</Text>
      <Pressable style={authStyles.primaryButton} onPress={() => void complete()}>
        <Text style={authStyles.primaryText}>Protect this device</Text>
      </Pressable>
    </ScrollView>
  );
}
