import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiGet, apiPost } from "../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch, type LockMode } from "../../src/auth/flowStore";
import { signUtf8WithPrivateJwk } from "../../src/auth/crypto";
import {
  getLocalPasswordLockState,
  isLocalPasswordEnabled,
  recordFailedAttemptAndMaybeLock,
  resetLockoutState,
  verifyDuressPassword,
  verifyLocalPassword,
} from "../../src/auth/localLock";
import { wipeAllLocalAuthData } from "../../src/auth/localWipe";
import { authenticate } from "../../src/auth/deviceAuth";

type ChallengeResponse = { challenge_id: string; challenge: string };
type LoginResponse = { session_token: string; user_id: string };

export default function UnlockScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockMode, setLockMode] = useState<LockMode>("none");
  const [hasBackupPassphrase, setHasBackupPassphrase] = useState(false);
  const [usePassphraseFallback, setUsePassphraseFallback] = useState(false);
  const [password, setPassword] = useState("");
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  const refreshLockState = async () => {
    const [enabled, lockState, flowState] = await Promise.all([
      isLocalPasswordEnabled(),
      getLocalPasswordLockState(),
      loadAuthFlowState(),
    ]);
    setHasBackupPassphrase(enabled);
    setLockMode(flowState.lockMode ?? "none");
    setUsePassphraseFallback((prev) => {
      if ((flowState.lockMode ?? "none") === "passphrase") {
        return true;
      }
      if (!enabled) {
        return false;
      }
      return prev;
    });
    setLockRemainingMs(lockState.remainingMs);
  };

  useEffect(() => {
    void refreshLockState();
    const timer = setInterval(() => {
      void refreshLockState();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const lockLabel = useMemo(() => {
    if (lockRemainingMs <= 0) {
      return null;
    }

    const totalSeconds = Math.ceil(lockRemainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [lockRemainingMs]);

  const usingPassphrase = lockMode === "passphrase" || usePassphraseFallback;

  const verifyPassphraseIfRequired = async () => {
    if (!usingPassphrase) {
      return true;
    }

    if (!password.trim()) {
      throw new Error("Enter your app passphrase to continue.");
    }

    const duressPassword = await verifyDuressPassword(password);
    if (duressPassword) {
      await resetLockoutState();
      await wipeAllLocalAuthData();
      setPassword("");
      router.replace({
        pathname: "/(auth)/welcome",
        params: { notice: "session-reset" },
      });
      return false;
    }

    const lockState = await getLocalPasswordLockState();
    if (lockState.remainingMs > 0) {
      const seconds = Math.ceil(lockState.remainingMs / 1000);
      throw new Error(`Too many failed attempts. Try again in ${seconds}s.`);
    }

    const validPassword = await verifyLocalPassword(password);
    if (!validPassword) {
      const outcome = await recordFailedAttemptAndMaybeLock();
      await refreshLockState();

      if (outcome.shouldWipeAllData) {
        await wipeAllLocalAuthData();
        router.replace("/(auth)/welcome");
        return false;
      }

      if (outcome.lockoutSeconds > 0) {
        throw new Error(`Wrong passphrase. Too many attempts. Try again in ${outcome.lockoutSeconds}s.`);
      }

      throw new Error("Wrong passphrase.");
    }

    await resetLockoutState();
    return true;
  };

  const unlock = async () => {
    setError(null);
    setLoading(true);
    try {
      if (lockMode === "biometric" && !usePassphraseFallback) {
        const authResult = await authenticate("biometric");
        if (!authResult.ok) {
          throw new Error(authResult.message ?? "Could not verify Face ID / Fingerprint.");
        }
      } else if (lockMode === "pin" && !usePassphraseFallback) {
        const authResult = await authenticate("pin");
        if (!authResult.ok) {
          throw new Error(authResult.message ?? "Could not verify device PIN.");
        }
      }

      if (usingPassphrase) {
        const canContinue = await verifyPassphraseIfRequired();
        if (!canContinue) {
          return;
        }
      }

      const state = await loadAuthFlowState();
      if (!state.deviceId || !state.devicePrivateJwk) {
        throw new Error("We couldn't unlock your secure storage on this device.");
      }

      const challenge = await apiPost<ChallengeResponse>("/v1/auth/challenge", {
        device_id: state.deviceId,
      });
      const signature = await signUtf8WithPrivateJwk(
        state.devicePrivateJwk,
        challenge.challenge,
      );

      const login = await apiPost<LoginResponse>("/v1/auth/login", {
        device_id: state.deviceId,
        challenge_id: challenge.challenge_id,
        challenge_signature: signature,
      });

      await saveAuthFlowPatch({
        authToken: login.session_token,
        userId: login.user_id,
        deviceId: state.deviceId,
      });
      setPassword("");

      await apiGet("/v1/sync/bootstrap", login.session_token);
      router.replace("/(tabs)/chat");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't unlock your secure storage on this device.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Unlock app</Text>
      <Text style={authStyles.subtitle}>
        {usingPassphrase
          ? "Enter your local app passphrase to continue."
          : lockMode === "biometric"
            ? "Use Face ID / Fingerprint to continue."
            : lockMode === "pin"
              ? "Use your device PIN or passcode to continue."
              : "Use your device security method to continue."}
      </Text>

      {usingPassphrase ? (
        <TextInput
          style={authStyles.input}
          placeholder="Enter app passphrase"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          editable={!loading}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
        />
      ) : null}

      {usingPassphrase && lockLabel ? (
        <Text style={authStyles.helper}>Too many attempts. Try again in {lockLabel}.</Text>
      ) : null}
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      <Pressable
        style={[
          authStyles.primaryButton,
          usingPassphrase && lockRemainingMs > 0 ? { opacity: 0.7 } : null,
        ]}
        onPress={() => void unlock()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={authStyles.primaryText}>Unlock</Text>
        )}
      </Pressable>

      {hasBackupPassphrase && (lockMode === "biometric" || lockMode === "pin") ? (
        <Pressable
          style={[authStyles.secondaryButton, loading ? { opacity: 0.7 } : null]}
          disabled={loading}
          onPress={() => {
            setUsePassphraseFallback((prev) => !prev);
            setError(null);
          }}
        >
          <Text style={authStyles.secondaryText}>
            {usePassphraseFallback
              ? lockMode === "biometric"
                ? "Use Face ID / Fingerprint instead"
                : "Use device PIN instead"
              : "Use app passphrase instead"}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        style={authStyles.secondaryButton}
        onPress={() => router.push("/(auth)/restore-or-add-device")}
      >
        <Text style={authStyles.secondaryText}>Having trouble?</Text>
      </Pressable>
    </ScrollView>
  );
}
