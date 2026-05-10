import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

export default function SyncingSharedScreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      if (state.authToken) {
        await apiGet("/v1/sync/bootstrap", state.authToken);
      }
      setReady(true);
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Syncing your shared chats</Text>
      <Text style={authStyles.subtitle}>
        Conversations shared across your devices are being prepared for this device.
        Chats created as device-specific will remain only on the original device.
      </Text>
      <Text style={authStyles.bullet}>Syncing account settings</Text>
      <Text style={authStyles.bullet}>Syncing shared chats</Text>
      <Text style={authStyles.bullet}>Syncing contacts</Text>

      {!ready ? <ActivityIndicator color="#fff" /> : null}
      <Pressable
        style={[authStyles.primaryButton, !ready ? { opacity: 0.6 } : null]}
        onPress={() => ready && router.replace("/(tabs)/chat")}
      >
        <Text style={authStyles.primaryText}>Go to inbox</Text>
      </Pressable>
    </ScrollView>
  );
}

