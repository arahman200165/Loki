import { View, Text, StyleSheet, Pressable } from "react-native";

export default function CallsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calls</Text>
      <Text style={styles.subtitle}>Your recent and upcoming calls will appear here.</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Start New Call</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});