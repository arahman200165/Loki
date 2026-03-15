import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { generateEd25519KeyPair } from "../../src/auth/crypto";
import { saveAuthFlowPatch } from "../../src/auth/flowStore";

type StartLinkResponse = {
  link_session_id: string;
  manual_code: string;
  expires_at: string;
};

export default function LinkDeviceScreen() {
  const [manualCode, setManualCode] = useState("...");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const keys = await generateEd25519KeyPair();
        const data = await apiPost<StartLinkResponse>("/v1/devices/link/start", {
          new_device_public_identity_key: keys.publicJwk,
          new_device_prekeys: [],
          platform: "android",
          device_label: "Pixel 9",
        });

        await saveAuthFlowPatch({
          pendingDevicePublicJwk: keys.publicJwk,
          pendingDevicePrivateJwk: keys.privateJwk,
          linkSessionId: data.link_session_id,
        });
        setManualCode(data.manual_code);
        setExpiresAt(new Date(data.expires_at).toLocaleTimeString());
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not start link session.");
      }
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Link this device</Text>
      <Text style={authStyles.subtitle}>
        {"Scan this code with a device that's already signed in to your account."}
      </Text>
      <Text style={authStyles.helper}>
        {"Open your other device and go to: Settings -> Devices -> Add device"}
      </Text>
      <Text style={authStyles.cardTitle}>{"Can't scan? Enter this code instead"}</Text>
      <Text style={[authStyles.body, { fontWeight: "700", fontSize: 28, letterSpacing: 3 }]}>
        {manualCode}
      </Text>
      <Text style={authStyles.helper}>This code expires in 5 minutes.</Text>
      {expiresAt ? <Text style={authStyles.helper}>Expires at: {expiresAt}</Text> : null}
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable style={authStyles.primaryButton} onPress={() => router.push("/(auth)/waiting-approval")}>
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => router.push("/(auth)/restore-kit")}>
        <Text style={authStyles.secondaryText}>Use recovery kit instead</Text>
      </Pressable>
    </ScrollView>
  );
}
