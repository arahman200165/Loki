import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState, saveAuthFlowPatch } from "../../src/auth/flowStore";
import { apiPost } from "../../src/auth/api";
import { disableLocalPassword } from "../../src/auth/localLock";
import { canUseBiometric, canUseDeviceCredential } from "../../src/auth/deviceAuth";
import type { LockMode } from "../../src/auth/flowStore";

const LOCK_OPTIONS = ["biometric", "pin", "passphrase"] as const;

export default function ProtectDeviceScreen() {
  const [lockMode, setLockMode] = useState<LockMode>("biometric");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionLabel = useMemo(
    () => ({
      biometric: "Use Face ID / Fingerprint",
      pin: "Use device PIN",
      passphrase: "Set app passphrase",
    }),
    [],
  );

  const continueWithLock = async (mode: LockMode) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "passphrase" || mode === "biometric" || mode === "pin") {
        if (mode === "biometric") {
          const biometric = await canUseBiometric();
          if (!biometric.supported) {
            throw new Error(biometric.reason ?? "Biometric unlock is unavailable on this device.");
          }
        }

        if (mode === "pin") {
          const pin = await canUseDeviceCredential();
          if (!pin.supported) {
            throw new Error(pin.reason ?? "Device PIN unlock is unavailable on this device.");
          }
        }

        router.push({
          pathname: "/(auth)/set-passphrase",
          params: { lockMode: mode },
        });
        return;
      }

      const state = await loadAuthFlowState();
      await saveAuthFlowPatch({ lockMode: mode });
      await disableLocalPassword();

      if (state.authToken && state.deviceId) {
        await apiPost(
          `/v1/devices/${state.deviceId}/security-state`,
          {
            local_lock_enabled: mode !== "none",
            lock_mode: mode,
          },
          state.authToken,
        );
      }

      router.push("/(auth)/display-name");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save app lock preference.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Protect this device</Text>
      <Text style={authStyles.subtitle}>
        Choose how to unlock the app on this device.
      </Text>
      <Text style={authStyles.helper}>This protects your private keys stored on this device.</Text>
      {error ? <Text style={authStyles.warning}>{error}</Text> : null}

      {LOCK_OPTIONS.map((option) => (
        <Pressable
          key={option}
          style={[authStyles.card, lockMode === option ? { borderColor: "#60a5fa" } : null]}
          onPress={() => setLockMode(option)}
        >
          <Text style={authStyles.cardTitle}>
            {optionLabel[option as keyof typeof optionLabel]}
          </Text>
        </Pressable>
      ))}

      <Pressable
        style={[authStyles.primaryButton, loading ? { opacity: 0.7 } : null]}
        onPress={() => void continueWithLock(lockMode)}
        disabled={loading}
      >
        <Text style={authStyles.primaryText}>Continue</Text>
      </Pressable>
      <Pressable
        style={[authStyles.secondaryButton, loading ? { opacity: 0.7 } : null]}
        onPress={() => void continueWithLock("none")}
        disabled={loading}
      >
        <Text style={authStyles.secondaryText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}
