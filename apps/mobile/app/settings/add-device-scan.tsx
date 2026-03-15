import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";

type ResolveResponse = {
  link_session_id: string;
  pending_device: {
    device_label: string;
    platform: string;
  };
};

export default function AddDeviceScanScreen() {
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resolveCode = async () => {
    setError(null);
    try {
      const state = await loadAuthFlowState();
      if (!state.authToken) {
        throw new Error("Sign in first.");
      }

      const data = await apiPost<ResolveResponse>(
        "/v1/devices/link/resolve",
        {
          manual_code: manualCode.replace(/\s/g, ""),
        },
        state.authToken,
      );

      await saveAuthFlowPatch({
        resolvedLinkSessionId: data.link_session_id,
        pendingDeviceLabel: data.pending_device.device_label,
        pendingDevicePlatform: data.pending_device.platform,
      });
      router.push("/settings/approve-device");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resolve code.");
    }
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Add a device</Text>
      <Text style={authStyles.subtitle}>Scan the code shown on your new device.</Text>
      <Text style={authStyles.tertiaryText}>Enter code manually</Text>

      <TextInput
        style={authStyles.input}
        placeholder="Enter manual code"
        placeholderTextColor="#94a3b8"
        keyboardType="number-pad"
        value={manualCode}
        onChangeText={(text) => {
          setManualCode(text);
          setError(null);
        }}
      />
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable style={authStyles.primaryButton} onPress={() => void resolveCode()}>
        <Text style={authStyles.primaryText}>Open scanner</Text>
      </Pressable>
    </ScrollView>
  );
}
