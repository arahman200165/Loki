import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  validatePublicId,
  normalizePublicId,
} from "@loki/shared";
import { apiPost } from "../../lib/apiClient";
import { usePublicId } from "../../hooks/usePublicId";
import type { RotatePublicIdResponse } from "@loki/shared";

export default function ManageId() {
  const { id, eligibleForFreeRotationAt, loading, fetchStatus } = usePublicId();
  const [newRaw, setNewRaw] = useState("");
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const normalized = normalizePublicId(newRaw);
  const validation = normalized ? validatePublicId(normalized) : null;

  const inlineError = (() => {
    if (!validation || validation.valid) return null;
    switch (validation.reason) {
      case "too_short": return "Too short — minimum 8 characters.";
      case "too_long": return "Too long — maximum 24 characters.";
      case "reserved": return "That ID is reserved.";
      case "confusable": return "Contains characters that look like others.";
      case "invalid_format": return "Only a–z, 0–9, and hyphens. Must start with a letter.";
    }
  })();

  const canRotateFree =
    eligibleForFreeRotationAt !== null && new Date() >= eligibleForFreeRotationAt;

  const daysUntilFree = (() => {
    if (!eligibleForFreeRotationAt || canRotateFree) return null;
    return Math.ceil(
      (eligibleForFreeRotationAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  })();

  const handleShare = async () => {
    if (!id) return;
    await Share.share({ message: `Add me on Loki: ${id}` });
  };

  const handleRotate = async () => {
    if (!validation?.valid || rotating) return;

    const confirmed = await new Promise<boolean>((resolve) =>
      Alert.alert(
        "Change your Public ID?",
        `Your current ID "${id}" will be locked for 180 days. Existing contacts will keep seeing your old ID until they refresh. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Change ID", style: "destructive", onPress: () => resolve(true) },
        ]
      )
    );
    if (!confirmed) return;

    setRotating(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      await apiPost<RotatePublicIdResponse>(
        "/public-id/rotate",
        { new_public_id: normalized },
        token
      );
      // Always 202 — check status to confirm
      setNewRaw("");
      await fetchStatus();
      Alert.alert("Request submitted", "Check your ID below — if unchanged, the new ID may already be taken.");
    } catch {
      Alert.alert("Connection error", "Could not reach the server. Try again.");
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Current Public ID</Text>
      {id ? (
        <>
          <View style={styles.idBox}>
            <Text style={styles.idText}>{id}</Text>
          </View>
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareText}>Share / Copy</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.noId}>No Public ID claimed yet.</Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Change Public ID</Text>

      {canRotateFree ? (
        <Text style={styles.cooldownOk}>Free change available now.</Text>
      ) : daysUntilFree !== null ? (
        <View style={styles.cooldownBox}>
          <Text style={styles.cooldownTitle}>Free change in {daysUntilFree} day{daysUntilFree === 1 ? "" : "s"}</Text>
          <Text style={styles.cooldownBody}>
            You can still change your ID now using a paid token. Otherwise wait for the free window.
          </Text>
        </View>
      ) : null}

      <TextInput
        style={[styles.input, inlineError ? styles.inputError : null]}
        placeholder="new-public-id"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={newRaw}
        onChangeText={setNewRaw}
        maxLength={26}
      />
      {inlineError ? (
        <Text style={styles.errorText}>{inlineError}</Text>
      ) : normalized && validation?.valid ? (
        <Text style={styles.validText}>Valid — will submit as @{normalized}</Text>
      ) : null}

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Before you change your ID</Text>
        <Text style={styles.warningBody}>
          Your old ID is locked for 180 days — nobody else can claim it, but
          existing contacts see your old ID until they update their records.
          Changing your ID does not notify anyone.
        </Text>
      </View>

      <Pressable
        style={[styles.rotateButton, (!validation?.valid || rotating) && styles.buttonDisabled]}
        onPress={handleRotate}
        disabled={!validation?.valid || rotating}
      >
        {rotating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.rotateText}>Submit ID Change</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0f172a" },
  container: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  idBox: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  idText: { fontSize: 20, fontWeight: "700", color: "#60a5fa" },
  noId: { color: "#64748b", fontSize: 15, marginBottom: 12 },
  shareButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  shareText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 24 },
  cooldownOk: { color: "#22c55e", fontSize: 13, marginBottom: 14 },
  cooldownBox: {
    backgroundColor: "#1a1a0e",
    borderColor: "#78350f",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  cooldownTitle: { color: "#fbbf24", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cooldownBody: { color: "#fcd34d", fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  validText: { color: "#22c55e", fontSize: 13, marginBottom: 12 },
  warningBox: {
    backgroundColor: "#1e0a0a",
    borderColor: "#7f1d1d",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningTitle: { fontSize: 14, fontWeight: "700", color: "#f87171", marginBottom: 6 },
  warningBody: { fontSize: 13, color: "#fca5a5", lineHeight: 19 },
  rotateButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  rotateText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
