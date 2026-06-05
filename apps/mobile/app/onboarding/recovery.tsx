import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function Recovery() {
  const proceed = () => router.replace("/(tabs)/chat");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Recovery setup</Text>
        <Text style={styles.subheading}>
          Recovery lets you regain access to your account if you lose your
          password. This step is optional, but skipping it means your account
          cannot be recovered.
        </Text>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>No recovery = permanent loss</Text>
          <Text style={styles.warningBody}>
            If you skip recovery setup and forget your password, your account
            is gone. We cannot restore it. This is by design.
          </Text>
        </View>

        <Text style={styles.comingSoon}>
          Recovery setup will be available in a future update.
        </Text>
      </View>

      <Pressable style={styles.skipButton} onPress={proceed}>
        <Text style={styles.skipButtonText}>Continue to Loki</Text>
      </Pressable>
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
  content: {
    flex: 1,
    paddingTop: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  subheading: {
    fontSize: 15,
    color: "#94a3b8",
    lineHeight: 22,
    marginBottom: 20,
  },
  warning: {
    backgroundColor: "#1e1a0e",
    borderColor: "#b45309",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fbbf24",
    marginBottom: 6,
  },
  warningBody: {
    fontSize: 13,
    color: "#fcd34d",
    lineHeight: 19,
  },
  comingSoon: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
  },
  skipButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#93c5fd",
    fontWeight: "600",
    fontSize: 16,
  },
});
