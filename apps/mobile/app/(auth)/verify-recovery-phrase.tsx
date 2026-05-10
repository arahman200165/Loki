import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { RECOVERY_WORDS } from "../../src/auth/wordlist";

export default function VerifyRecoveryPhraseScreen() {
  const [phrase, setPhrase] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setPhrase(state.recoveryPhrase ?? []);
    };
    void run();
  }, []);

  const promptIndex = 3;
  const correct = phrase[promptIndex] ?? "";
  const options = useMemo(() => {
    const fallback = RECOVERY_WORDS.filter((word) => word !== correct).slice(0, 2);
    return [correct, ...fallback].sort(() => Math.random() - 0.5);
  }, [correct]);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Verify your recovery phrase</Text>
      <Text style={authStyles.subtitle}>Select the correct words to continue.</Text>
      <Text style={authStyles.body}>What is word {promptIndex + 1}?</Text>

      <View>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[authStyles.card, selected === option ? { borderColor: "#60a5fa" } : null]}
            onPress={() => setSelected(option)}
          >
            <Text style={authStyles.cardText}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={authStyles.primaryButton}
        onPress={async () => {
          if (selected !== correct) {
            Alert.alert("That doesn't match your recovery phrase. Try again.");
            return;
          }
          await saveAuthFlowPatch({ recoveryVerified: true });
          router.push("/(auth)/protect-device");
        }}
      >
        <Text style={authStyles.primaryText}>Confirm</Text>
      </Pressable>
      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
