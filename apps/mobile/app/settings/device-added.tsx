import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { saveAuthFlowPatch } from "../../src/auth/flowStore";

export default function DeviceAddedScreen() {
  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Device added</Text>
      <Text style={authStyles.subtitle}>
        The new device can now access your shared chats.
      </Text>

      <Pressable
        style={authStyles.primaryButton}
        onPress={async () => {
          await saveAuthFlowPatch({
            resolvedLinkSessionId: null,
            pendingDeviceLabel: null,
            pendingDevicePlatform: null,
          });
          router.replace("/settings/devices");
        }}
      >
        <Text style={authStyles.primaryText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

