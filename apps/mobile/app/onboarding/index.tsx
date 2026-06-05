import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function OnboardingEntry() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Loki</Text>
        <Text style={styles.tagline}>Private by design.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/onboarding/explainer")}
        >
          <Text style={styles.primaryButtonText}>Create account</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Log in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 64,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  actions: {
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#93c5fd",
    fontSize: 15,
  },
});
