import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 10,
  },
  tertiaryButton: {
    paddingVertical: 10,
    marginBottom: 6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  tertiaryText: {
    color: "#93c5fd",
    fontSize: 14,
    textAlign: "center",
  },
  warning: {
    color: "#fca5a5",
    marginBottom: 12,
  },
  helper: {
    color: "#94a3b8",
    marginBottom: 10,
  },
});
