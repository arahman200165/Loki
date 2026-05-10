import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

type ContactCodeResponse = { contact_code: string };

export default function PrivateIdScreen() {
  const [contactCode, setContactCode] = useState<string>("loki:----");

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      if (!state.authToken) {
        return;
      }
      const data = await apiGet<ContactCodeResponse>("/v1/profile/contact-code", state.authToken);
      setContactCode(data.contact_code);
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Your private ID is ready</Text>
      <Text style={authStyles.subtitle}>
        People can connect with you using your private contact code. You can add more devices later
        from Settings.
      </Text>

      <Text style={authStyles.cardTitle}>Your contact code</Text>
      <Text style={[authStyles.body, { fontWeight: "700", fontSize: 18 }]}>{contactCode}</Text>
      <Pressable
        style={authStyles.secondaryButton}
        onPress={() => Alert.alert("Copy code", `Copied: ${contactCode}`)}
      >
        <Text style={authStyles.secondaryText}>Copy code</Text>
      </Pressable>
      <Pressable
        style={authStyles.secondaryButton}
        onPress={() => Alert.alert("Share code", `Share: ${contactCode}`)}
      >
        <Text style={authStyles.secondaryText}>Share code</Text>
      </Pressable>

      <Pressable style={authStyles.primaryButton} onPress={() => router.replace("/(tabs)/chat")}>
        <Text style={authStyles.primaryText}>Go to inbox</Text>
      </Pressable>
    </ScrollView>
  );
}
