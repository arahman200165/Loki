import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { parseRecoveryFileText } from "../../src/auth/recoveryFile";
import {
  deriveRecoveryKeyPairFromPhrase,
  isValidRecoveryPhrase,
  parseRecoveryPhraseInput,
} from "../../src/auth/recoveryPhrase";

export default function RestoreKitScreen() {
  const [phraseInput, setPhraseInput] = useState("");
  const [accountLocator, setAccountLocator] = useState("");
  const [recoveryPrivateJwk, setRecoveryPrivateJwk] = useState("");
  const [recoveryPublicJwkFromFile, setRecoveryPublicJwkFromFile] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importRecoveryFile = async () => {
    setIsImporting(true);
    setError(null);
    setImportFeedback(null);

    try {
      const pickResult = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json", "*/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (pickResult.canceled) {
        return;
      }

      const asset = pickResult.assets[0];
      if (!asset?.uri) {
        throw new Error("Couldn't open that recovery file.");
      }

      const fileText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = parseRecoveryFileText(fileText);

      setAccountLocator(parsed.accountLocator);
      setRecoveryPrivateJwk(parsed.recoveryPrivateJwk);
      setRecoveryPublicJwkFromFile(parsed.recoveryPublicJwk);
      setImportFeedback("Recovery file loaded.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Couldn't import recovery file.";
      setError(message);
    } finally {
      setIsImporting(false);
    }
  };

  const continueFlow = async () => {
    const locator = accountLocator.trim();
    const manualRecoveryKey = recoveryPrivateJwk.trim();
    const phraseWords = parseRecoveryPhraseInput(phraseInput);

    let recoveryKey = manualRecoveryKey;
    let recoveryPublicJwk = recoveryPublicJwkFromFile;

    if (!locator) {
      setError("Enter your account ID (LOKI:...).");
      return;
    }

    if (!phraseWords.length && !manualRecoveryKey) {
      setError("Enter your recovery phrase or paste your recovery private JWK.");
      return;
    }

    if (phraseWords.length) {
      if (!isValidRecoveryPhrase(phraseWords)) {
        setError("Recovery phrase is invalid. Check word order and spelling.");
        return;
      }

      const derived = deriveRecoveryKeyPairFromPhrase(phraseWords);
      recoveryKey = derived.privateJwk;
      recoveryPublicJwk = derived.publicJwk;
    } else {
      try {
        const parsed = JSON.parse(manualRecoveryKey) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error();
        }
      } catch {
        setError("Recovery private JWK must be valid JSON.");
        return;
      }
    }

    const state = await loadAuthFlowState();

    await saveAuthFlowPatch({
      accountLocator: locator,
      recoveryPrivateJwk: recoveryKey,
      recoveryPublicJwk: recoveryPublicJwk ?? state.recoveryPublicJwk,
      ...(phraseWords.length ? { recoveryPhrase: phraseWords } : {}),
    });
    router.push("/(auth)/verifying-recovery");
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Restore your account</Text>
      <Text style={authStyles.subtitle}>
        Use your recovery phrase or encrypted recovery file to access your account on this device.
      </Text>
      <Text style={authStyles.cardTitle}>Recovery phrase</Text>
      <Text style={authStyles.helper}>Recovery file</Text>
      <Pressable
        style={[authStyles.secondaryButton, isImporting ? { opacity: 0.7 } : null]}
        onPress={() => void importRecoveryFile()}
        disabled={isImporting}
      >
        <Text style={authStyles.secondaryText}>
          {isImporting ? "Importing recovery file..." : "Import recovery file"}
        </Text>
      </Pressable>
      {importFeedback ? <Text style={authStyles.helper}>{importFeedback}</Text> : null}
      <TextInput
        style={authStyles.input}
        placeholder="Account ID (LOKI:...)"
        placeholderTextColor="#94a3b8"
        value={accountLocator}
        onChangeText={(text) => {
          setAccountLocator(text);
          setError(null);
          setImportFeedback(null);
        }}
      />
      <TextInput
        style={[authStyles.input, { minHeight: 100, textAlignVertical: "top" }]}
        placeholder="Paste recovery phrase"
        placeholderTextColor="#94a3b8"
        multiline
        value={phraseInput}
        onChangeText={(text) => {
          setPhraseInput(text);
          setError(null);
          setImportFeedback(null);
        }}
      />
      <TextInput
        style={[authStyles.input, { minHeight: 120, textAlignVertical: "top" }]}
        placeholder="Recovery private JWK (JSON, optional)"
        placeholderTextColor="#94a3b8"
        multiline
        value={recoveryPrivateJwk}
        onChangeText={(text) => {
          setRecoveryPrivateJwk(text);
          setError(null);
          setImportFeedback(null);
        }}
      />
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable style={authStyles.primaryButton} onPress={() => void continueFlow()}>
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
