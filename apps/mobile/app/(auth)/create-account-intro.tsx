import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";

export default function CreateAccountIntroScreen() {
  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Create your private account</Text>
      <Text style={authStyles.subtitle}>
        We&apos;ll create a private identity for you on this device. You can add more devices later.
        You&apos;ll also receive a recovery kit. Keep it safe - it&apos;s the only way to restore your
        account if you lose your devices.
      </Text>

      <Text style={authStyles.cardTitle}>What happens next</Text>
      <Text style={authStyles.bullet}>- A private identity will be created on this device</Text>
      <Text style={authStyles.bullet}>- A recovery kit will be generated for you</Text>
      <Text style={authStyles.bullet}>- You&apos;ll set a lock for this app</Text>

      <Pressable
        style={authStyles.primaryButton}
        onPress={() => router.push("/(auth)/creating-identity")}
      >
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

