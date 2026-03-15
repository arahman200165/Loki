import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";

export default function RestoreOrAddDeviceScreen() {
  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Restore or add a device</Text>
      <Text style={authStyles.subtitle}>
        Choose how you want to access your account on this device.
      </Text>

      <Pressable style={authStyles.card} onPress={() => router.push("/(auth)/link-device")}>
        <Text style={authStyles.cardTitle}>Link from another device</Text>
        <Text style={authStyles.cardText}>Fastest and most secure</Text>
        <Text style={authStyles.helper}>Link this device</Text>
      </Pressable>

      <Pressable style={authStyles.card} onPress={() => router.push("/(auth)/restore-kit")}>
        <Text style={authStyles.cardTitle}>Use recovery phrase or file</Text>
        <Text style={authStyles.cardText}>Use this if you no longer have access to a trusted device</Text>
        <Text style={authStyles.helper}>Restore with recovery kit</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
