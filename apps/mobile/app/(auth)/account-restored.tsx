import { useEffect } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

export default function AccountRestoredScreen() {
  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      if (state.authToken) {
        await apiGet("/v1/sync/bootstrap", state.authToken);
      }
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Account restored</Text>
      <Text style={authStyles.subtitle}>This device now has access to your account.</Text>

      <Text style={authStyles.cardTitle}>What will sync:</Text>
      <Text style={authStyles.bullet}>Shared chats</Text>
      <Text style={authStyles.bullet}>Contacts</Text>
      <Text style={authStyles.bullet}>Account settings</Text>

      <Text style={[authStyles.cardTitle, { marginTop: 14 }]}>What stays separate:</Text>
      <Text style={authStyles.bullet}>Device-specific chats on other devices</Text>

      <Pressable style={authStyles.primaryButton} onPress={() => router.replace("/(tabs)/chat")}>
        <Text style={authStyles.primaryText}>Go to inbox</Text>
      </Pressable>
    </ScrollView>
  );
}

