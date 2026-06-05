import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

const POINTS = [
  {
    title: "No phone number or email",
    body: "Your identity is a username you choose. Loki never asks for your real-world contact info.",
  },
  {
    title: "Messages stay off our servers",
    body: "We relay encrypted envelopes. We cannot read your messages, and they are deleted after delivery.",
  },
  {
    title: "No password recovery",
    body: "If you lose your password and skip recovery setup, your account cannot be restored. We have no back door.",
  },
  {
    title: "Your account, your device",
    body: "Sessions are tied to this device. Signing in on another device is a separate step.",
  },
];

export default function Explainer() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Before you create an account</Text>
        <Text style={styles.subheading}>
          Loki is built differently. A few things are worth knowing upfront.
        </Text>

        {POINTS.map((point) => (
          <View key={point.title} style={styles.card}>
            <Text style={styles.cardTitle}>{point.title}</Text>
            <Text style={styles.cardBody}>{point.body}</Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/onboarding/register")}
      >
        <Text style={styles.buttonText}>I understand — continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
  },
  scroll: {
    paddingBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
