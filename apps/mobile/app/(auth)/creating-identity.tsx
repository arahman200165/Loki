import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiPost } from "../../src/auth/api";
import { clearTransientOnboardingState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { generateEd25519KeyPair, signUtf8WithPrivateJwk } from "../../src/auth/crypto";
import { generateRecoveryPhrase } from "../../src/auth/wordlist";

type RegisterStartResponse = {
  user_id: string;
  device_id: string;
  account_locator: string;
  registration_challenge: string;
};

type RegisterCompleteResponse = {
  session_token: string;
  user_id: string;
  device_id: string;
};

const PROGRESS_STEPS = [
  "Generating account identity",
  "Creating device keys",
  "Preparing secure storage",
];

export default function CreatingIdentityScreen() {
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      await clearTransientOnboardingState();

      setProgressIndex(0);
      const userKeys = await generateEd25519KeyPair();

      setProgressIndex(1);
      const deviceKeys = await generateEd25519KeyPair();
      const recoveryKeys = await generateEd25519KeyPair();
      const phrase = generateRecoveryPhrase();

      setProgressIndex(2);
      const start = await apiPost<RegisterStartResponse>("/v1/auth/register/start", {
        user_public_identity_key: userKeys.publicJwk,
        device_public_identity_key: deviceKeys.publicJwk,
        recovery_public_material: recoveryKeys.publicJwk,
        device_prekeys: [],
        platform: "mobile",
        device_label: "iPhone",
      });

      const challengeSignature = await signUtf8WithPrivateJwk(
        deviceKeys.privateJwk,
        start.registration_challenge,
      );

      const complete = await apiPost<RegisterCompleteResponse>("/v1/auth/register/complete", {
        user_id: start.user_id,
        device_id: start.device_id,
        challenge_signature: challengeSignature,
      });

      await saveAuthFlowPatch({
        authToken: complete.session_token,
        userId: complete.user_id,
        deviceId: complete.device_id,
        devicePublicJwk: deviceKeys.publicJwk,
        devicePrivateJwk: deviceKeys.privateJwk,
        recoveryPublicJwk: recoveryKeys.publicJwk,
        recoveryPrivateJwk: recoveryKeys.privateJwk,
        userPublicJwk: userKeys.publicJwk,
        accountLocator: start.account_locator,
        recoveryPhrase: phrase,
        recoveryPhraseViewed: false,
        recoveryFileExported: false,
        recoveryVerified: false,
      });

      router.replace("/(auth)/recovery-kit");
    } catch (caught) {
      const details =
        caught instanceof Error && caught.message ? ` ${caught.message}` : "";
      setError(`We couldn't create your private identity on this device.${details}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Creating your private identity</Text>
      <Text style={authStyles.subtitle}>This may take a moment.</Text>

      {PROGRESS_STEPS.map((step, index) => (
        <Text key={step} style={authStyles.bullet}>
          {index <= progressIndex ? "- " : ""}{step}
        </Text>
      ))}

      {loading && <ActivityIndicator color="#fff" size="large" />}

      {error ? (
        <>
          <Text style={authStyles.warning}>{error}</Text>
          <Pressable style={authStyles.primaryButton} onPress={() => void run()}>
            <Text style={authStyles.primaryText}>Try again</Text>
          </Pressable>
          <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
            <Text style={authStyles.secondaryText}>Back</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
