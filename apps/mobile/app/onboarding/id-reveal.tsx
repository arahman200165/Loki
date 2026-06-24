import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
} from "react-native";
import { router } from "expo-router";
import { usePublicId } from "../../hooks/usePublicId";

export default function IdReveal() {
  const { id, eligibleForFreeRotationAt, loading, error, fetchStatus } = usePublicId();
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleShare = async () => {
    if (!id) return;
    await Share.share({ message: `Add me on Loki: ${id}` });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const rotationLabel = (() => {
    if (!eligibleForFreeRotationAt) return null;
    const now = new Date();
    if (now >= eligibleForFreeRotationAt) return "Free rotation available now.";
    const days = Math.round(
      (eligibleForFreeRotationAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Free ID change available in ${days} day${days === 1 ? "" : "s"}.`;
  })();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Confirming your ID…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchStatus}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {id ? (
        <>
          <Text style={styles.label}>Your Handle</Text>
          <View style={styles.idBox}>
            <Text style={styles.idText}>{id}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionText}>{shared ? "Shared!" : "Share / Copy"}</Text>
            </Pressable>
          </View>

          {rotationLabel && (
            <Text style={styles.rotationHint}>{rotationLabel}</Text>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Share this ID to connect</Text>
            <Text style={styles.infoBody}>
              People need your exact handle to send a contact request. There
              is no search or discovery — only people you give it to can reach
              you.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Changing your ID</Text>
            <Text style={styles.infoBody}>
              You can change your handle once every 7 days for free. Your old
              ID is locked for 180 days and cannot be claimed by anyone else.
              Changing your ID does not notify existing contacts.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.noIdHeading}>That ID wasn{"'"}t available</Text>
          <Text style={styles.noIdBody}>
            The ID you chose may already be taken. Go back and try a different one —
            you need a handle before you can receive contact requests.
          </Text>
        </>
      )}

      <Pressable
        style={styles.continueButton}
        onPress={() =>
          id
            ? router.replace("/onboarding/recovery")
            : router.replace("/onboarding/choose-id")
        }
      >
        <Text style={styles.continueText}>{id ? "Continue" : "Try another ID"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 24, paddingTop: 40 },
  center: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { color: "#94a3b8", marginTop: 16, fontSize: 15 },
  errorText: { color: "#ef4444", fontSize: 15, marginBottom: 16, textAlign: "center" },
  retryButton: { backgroundColor: "#1e293b", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  label: { fontSize: 13, color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  idBox: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  idText: { fontSize: 22, fontWeight: "700", color: "#60a5fa", letterSpacing: 0.5 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  rotationHint: { color: "#94a3b8", fontSize: 13, textAlign: "center", marginBottom: 24 },
  infoBox: {
    backgroundColor: "#0f2336",
    borderColor: "#1e4a72",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#60a5fa", marginBottom: 6 },
  infoBody: { fontSize: 13, color: "#93c5fd", lineHeight: 19 },
  noIdHeading: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 12 },
  noIdBody: { fontSize: 15, color: "#94a3b8", lineHeight: 22, marginBottom: 32 },
  continueButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
  },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
