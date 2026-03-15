import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState } from "../../src/auth/flowStore";

export default function RecoveryKitScreen() {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setCanContinue(state.recoveryPhraseViewed || state.recoveryFileExported);
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Save your recovery kit</Text>
      <Text style={authStyles.subtitle}>
        Your recovery kit is the only way to restore your account if you lose your devices. We do
        not store a copy for you.
      </Text>

      <Text style={authStyles.cardTitle}>Choose how to save it</Text>

      <Pressable
        style={authStyles.card}
        onPress={() => router.push("/(auth)/recovery-phrase-view")}
      >
        <Text style={authStyles.cardTitle}>Recovery phrase</Text>
        <Text style={authStyles.cardText}>A set of words you can write down and store offline.</Text>
        <Text style={authStyles.helper}>View recovery phrase</Text>
      </Pressable>

      <Pressable
        style={authStyles.card}
        onPress={() => router.push("/(auth)/recovery-file-exported")}
      >
        <Text style={authStyles.cardTitle}>Encrypted recovery file</Text>
        <Text style={authStyles.cardText}>A file you can store in a secure location.</Text>
        <Text style={authStyles.helper}>Save recovery file</Text>
      </Pressable>

      <Text style={authStyles.warning}>
        If you lose your devices and your recovery kit, your account cannot be restored.
      </Text>

      <Pressable
        style={[authStyles.primaryButton, !canContinue && { opacity: 0.5 }]}
        onPress={() => canContinue && router.push("/(auth)/protect-device")}
      >
        <Text style={authStyles.primaryText}>I&apos;ve saved it</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
