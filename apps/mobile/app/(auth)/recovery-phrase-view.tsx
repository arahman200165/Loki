import { useEffect, useState } from "react";
import { Alert, NativeModules, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";

export default function RecoveryPhraseViewScreen() {
  const [phrase, setPhrase] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const copyPhrase = async () => {
    const text = phrase.join(" ").trim();
    if (!text) {
      return;
    }

    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(text);
      } else {
        const nativeClipboard =
          (NativeModules as {
            Clipboard?: { setString?: (value: string) => void };
            ClipboardModule?: { setString?: (value: string) => void };
          }).Clipboard ??
          (NativeModules as {
            ClipboardModule?: { setString?: (value: string) => void };
          }).ClipboardModule;

        if (!nativeClipboard?.setString) {
          throw new Error("Clipboard is unavailable on this device.");
        }

        nativeClipboard.setString(text);
      }

      setCopyFeedback("Recovery phrase copied to clipboard.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't copy recovery phrase.";
      setCopyFeedback(null);
      Alert.alert("Copy failed", message);
    }
  };

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setPhrase(state.recoveryPhrase ?? []);
    };
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Your recovery phrase</Text>
      <Text style={authStyles.subtitle}>
        Write these words down in order and keep them somewhere safe.
      </Text>

      <View style={authStyles.card}>
        {phrase.map((word, index) => (
          <Text key={`${word}-${index}`} style={authStyles.bullet}>
            {index + 1}. {word}
          </Text>
        ))}
      </View>

      <Text style={authStyles.warning}>
        Anyone with this phrase may be able to restore your account.
      </Text>
      {copyFeedback ? <Text style={authStyles.helper}>{copyFeedback}</Text> : null}

      <Pressable style={authStyles.secondaryButton} onPress={() => void copyPhrase()}>
        <Text style={authStyles.secondaryText}>Copy phrase</Text>
      </Pressable>

      <Pressable
        style={authStyles.primaryButton}
        onPress={async () => {
          await saveAuthFlowPatch({ recoveryPhraseViewed: true });
          router.push("/(auth)/verify-recovery-phrase");
        }}
      >
        <Text style={authStyles.primaryText}>I wrote it down</Text>
      </Pressable>

      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Show again later</Text>
      </Pressable>
    </ScrollView>
  );
}
