import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { buildRecoveryFileV1, stringifyRecoveryFile } from "../../src/auth/recoveryFile";

export default function RecoveryKitScreen() {
  const [canContinue, setCanContinue] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const refreshContinue = async () => {
    const state = await loadAuthFlowState();
    setCanContinue(state.recoveryPhraseViewed || state.recoveryFileExported);
  };

  const exportRecoveryFile = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const state = await loadAuthFlowState();
      if (!state.accountLocator || !state.recoveryPrivateJwk) {
        throw new Error("Recovery data is missing on this device. Try creating a new recovery kit.");
      }

      const payload = buildRecoveryFileV1({
        accountLocator: state.accountLocator,
        recoveryPrivateJwk: state.recoveryPrivateJwk,
        recoveryPublicJwk: state.recoveryPublicJwk,
      });

      if (!FileSystem.cacheDirectory) {
        throw new Error("File export is unavailable on this device.");
      }

      const safeLocator = state.accountLocator.replace(/[^a-zA-Z0-9_-]/g, "_");
      const uri = `${FileSystem.cacheDirectory}loki-recovery-${safeLocator}.json`;
      await FileSystem.writeAsStringAsync(uri, stringifyRecoveryFile(payload), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error("Sharing is unavailable on this device.");
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: "Save encrypted recovery file",
        mimeType: "application/json",
        UTI: "public.json",
      });

      await saveAuthFlowPatch({ recoveryFileExported: true });
      setCanContinue(true);
      router.push("/(auth)/recovery-file-exported");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Couldn't save recovery file.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    void refreshContinue();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Save your recovery kit</Text>
      <Text style={authStyles.subtitle}>
        Your recovery kit is the only way to restore your account if you lose your devices. We do
        not store a copy for you.
      </Text>

      <Text style={authStyles.cardTitle}>Choose how to save it</Text>

      <Pressable
        style={authStyles.card}
        onPress={() => router.push("/(auth)/recovery-phrase-view")}
      >
        <Text style={authStyles.cardTitle}>Recovery phrase</Text>
        <Text style={authStyles.cardText}>A set of words you can write down and store offline.</Text>
        <Text style={authStyles.helper}>View recovery phrase</Text>
      </Pressable>

      <Pressable
        style={[authStyles.card, isExporting ? { opacity: 0.7 } : null]}
        onPress={() => void exportRecoveryFile()}
        disabled={isExporting}
      >
        <Text style={authStyles.cardTitle}>Encrypted recovery file</Text>
        <Text style={authStyles.cardText}>A file you can store in a secure location.</Text>
        <Text style={authStyles.helper}>{isExporting ? "Saving recovery file..." : "Save recovery file"}</Text>
      </Pressable>

      {exportError ? <Text style={authStyles.warning}>{exportError}</Text> : null}

      <Text style={authStyles.warning}>
        If you lose your devices and your recovery kit, your account cannot be restored.
      </Text>

      <Pressable
        style={[authStyles.primaryButton, !canContinue && { opacity: 0.5 }]}
        onPress={() => canContinue && router.push("/(auth)/protect-device")}
      >
        <Text style={authStyles.primaryText}>I&apos;ve saved it</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
