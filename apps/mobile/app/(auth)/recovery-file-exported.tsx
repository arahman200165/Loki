import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { saveAuthFlowPatch } from "../../src/auth/flowStore";

export default function RecoveryFileExportedScreen() {
  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Recovery file saved</Text>
      <Text style={authStyles.subtitle}>
        Store this file somewhere secure. You may also add a passphrase for extra protection.
      </Text>

      <Pressable
        style={authStyles.primaryButton}
        onPress={async () => {
          await saveAuthFlowPatch({ recoveryFileExported: true });
          router.push("/(auth)/protect-device");
        }}
      >
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>

      <Pressable
        style={authStyles.secondaryButton}
        onPress={() => router.push("/(auth)/recovery-phrase-view")}
      >
        <Text style={authStyles.secondaryText}>Use recovery phrase instead</Text>
      </Pressable>
    </ScrollView>
  );
}

