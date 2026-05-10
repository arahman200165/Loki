import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { authStyles } from "../../../src/auth/ui";
import { apiPost } from "../../../src/auth/api";
import { loadAuthFlowState, saveAuthFlowPatch, type LockMode } from "../../../src/auth/flowStore";
import {
  disableLocalPassword,
  hasDuressPasswordEnabled,
  isLocalPasswordEnabled,
  setDuressPassword as saveDuressPassword,
  setLocalPassword,
  verifyLocalPassword,
} from "../../../src/auth/localLock";
import { canUseBiometric, canUseDeviceCredential } from "../../../src/auth/deviceAuth";

const MODE_OPTIONS: LockMode[] = ["biometric", "pin", "passphrase", "none"];

const MODE_LABEL: Record<LockMode, string> = {
  biometric: "Use Face ID / Fingerprint",
  pin: "Use device PIN",
  passphrase: "Use app passphrase",
  none: "No local lock",
};

const syncSecurityState = async (enabled: boolean, lockMode: LockMode) => {
  const state = await loadAuthFlowState();
  if (!state.authToken || !state.deviceId) {
    return;
  }

  await apiPost(
    `/v1/devices/${state.deviceId}/security-state`,
    {
      local_lock_enabled: enabled,
      lock_mode: lockMode,
    },
    state.authToken,
  );
};

export default function AppLockSettingsScreen() {
  const [lockMode, setLockMode] = useState<LockMode>("none");
  const [selectedMode, setSelectedMode] = useState<LockMode>("none");
  const [passphraseEnabled, setPassphraseEnabled] = useState(false);
  const [duressEnabled, setDuressEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [duressPassword, setDuressPassword] = useState("");
  const [confirmDuressPassword, setConfirmDuressPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [state, nextPassphrase, nextDuress] = await Promise.all([
      loadAuthFlowState(),
      isLocalPasswordEnabled(),
      hasDuressPasswordEnabled(),
    ]);
    const nextMode = state.lockMode ?? "none";
    setLockMode(nextMode);
    setSelectedMode(nextMode);
    setPassphraseEnabled(nextPassphrase);
    setDuressEnabled(nextDuress);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const clearFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDuressPassword("");
    setConfirmDuressPassword("");
  };

  const validateBackupPassphraseInputs = () => {
    const first = newPassword.trim();
    const second = confirmPassword.trim();
    const duressFirst = duressPassword.trim();
    const duressSecond = confirmDuressPassword.trim();

    if (first.length < 6) {
      throw new Error("Passphrase must be at least 6 characters.");
    }
    if (first !== second) {
      throw new Error("Passphrase fields do not match.");
    }
    if (duressFirst.length < 6) {
      throw new Error("Duress passphrase must be at least 6 characters.");
    }
    if (duressFirst !== duressSecond) {
      throw new Error("Duress passphrase fields do not match.");
    }
    if (duressFirst === first) {
      throw new Error("Duress passphrase must be different from app passphrase.");
    }

    return { passphrase: first, duressPassphrase: duressFirst };
  };

  const ensureBackupPassphrase = async () => {
    if (passphraseEnabled) {
      return;
    }

    const { passphrase, duressPassphrase } = validateBackupPassphraseInputs();
    await setLocalPassword(passphrase);
    await saveDuressPassword(duressPassphrase);
  };

  const ensureCapabilityForMode = async (mode: LockMode) => {
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
  };

  const applyMode = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (selectedMode === "none") {
        if (passphraseEnabled) {
          if (!currentPassword.trim()) {
            throw new Error("Enter your current passphrase to disable app lock.");
          }

          const validCurrent = await verifyLocalPassword(currentPassword);
          if (!validCurrent) {
            throw new Error("Current passphrase is incorrect.");
          }
        }

        await disableLocalPassword();
        await saveAuthFlowPatch({ lockMode: "none" });
        await syncSecurityState(false, "none");
        await refresh();
        clearFields();
        setMessage("App lock disabled.");
        return;
      }

      await ensureCapabilityForMode(selectedMode);
      await ensureBackupPassphrase();

      await saveAuthFlowPatch({ lockMode: selectedMode });
      await syncSecurityState(true, selectedMode);
      await refresh();
      clearFields();
      setMessage(`App lock mode updated to ${MODE_LABEL[selectedMode]}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update app lock mode.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    const first = newPassword.trim();
    const second = confirmPassword.trim();
    if (!currentPassword.trim()) {
      setError("Enter your current passphrase.");
      return;
    }
    if (first.length < 6) {
      setError("New passphrase must be at least 6 characters.");
      return;
    }
    if (first !== second) {
      setError("New passphrase fields do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const validCurrent = await verifyLocalPassword(currentPassword);
      if (!validCurrent) {
        throw new Error("Current passphrase is incorrect.");
      }
      await setLocalPassword(first);
      clearFields();
      setMessage("App passphrase updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update app passphrase.");
    } finally {
      setLoading(false);
    }
  };

  const updateDuressPassword = async () => {
    const duressFirst = duressPassword.trim();
    const duressSecond = confirmDuressPassword.trim();
    if (duressFirst.length < 6) {
      setError("Duress passphrase must be at least 6 characters.");
      return;
    }
    if (duressFirst !== duressSecond) {
      setError("Duress passphrase fields do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await saveDuressPassword(duressFirst);
      await refresh();
      setDuressPassword("");
      setConfirmDuressPassword("");
      setMessage("Duress passphrase updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update duress passphrase.");
    } finally {
      setLoading(false);
    }
  };

  const needsBackupPassphrase = useMemo(
    () => (selectedMode === "biometric" || selectedMode === "pin" || selectedMode === "passphrase") && !passphraseEnabled,
    [passphraseEnabled, selectedMode],
  );

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>App lock</Text>
      <Text style={authStyles.subtitle}>
        Choose how to protect app opening on this device.
      </Text>

      <Text style={authStyles.helper}>Current mode: {MODE_LABEL[lockMode]}</Text>
      <Text style={authStyles.helper}>
        Backup passphrase: {passphraseEnabled ? "configured" : "not configured"}
      </Text>
      <Text style={authStyles.helper}>
        Duress passphrase: {duressEnabled ? "configured" : "not configured"}
      </Text>

      {MODE_OPTIONS.map((mode) => (
        <Pressable
          key={mode}
          style={[authStyles.card, selectedMode === mode ? { borderColor: "#60a5fa" } : null]}
          onPress={() => {
            setSelectedMode(mode);
            setError(null);
          }}
        >
          <Text style={authStyles.cardTitle}>{MODE_LABEL[mode]}</Text>
        </Pressable>
      ))}

      {selectedMode === "none" && passphraseEnabled ? (
        <TextInput
          style={authStyles.input}
          placeholder="Current passphrase (required to disable)"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={currentPassword}
          onChangeText={(text) => {
            setCurrentPassword(text);
            setError(null);
          }}
        />
      ) : null}

      {needsBackupPassphrase ? (
        <>
          <Text style={authStyles.helper}>
            Set backup app passphrase and duress passphrase for this mode.
          </Text>
          <TextInput
            style={authStyles.input}
            placeholder="Backup app passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError(null);
            }}
          />
          <TextInput
            style={authStyles.input}
            placeholder="Confirm backup app passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
          />
          <TextInput
            style={authStyles.input}
            placeholder="Duress passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={duressPassword}
            onChangeText={(text) => {
              setDuressPassword(text);
              setError(null);
            }}
          />
          <TextInput
            style={authStyles.input}
            placeholder="Confirm duress passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmDuressPassword}
            onChangeText={(text) => {
              setConfirmDuressPassword(text);
              setError(null);
            }}
          />
        </>
      ) : null}

      {error ? <Text style={authStyles.warning}>{error}</Text> : null}
      {message ? <Text style={authStyles.helper}>{message}</Text> : null}

      <Pressable
        style={[authStyles.primaryButton, loading ? { opacity: 0.7 } : null]}
        disabled={loading}
        onPress={() => void applyMode()}
      >
        <Text style={authStyles.primaryText}>Apply lock mode</Text>
      </Pressable>

      {passphraseEnabled ? (
        <>
          <TextInput
            style={authStyles.input}
            placeholder="Current passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setError(null);
            }}
          />

          <TextInput
            style={authStyles.input}
            placeholder="New passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError(null);
            }}
          />

          <TextInput
            style={authStyles.input}
            placeholder="Confirm new passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
          />

          <Pressable
            style={[authStyles.secondaryButton, loading ? { opacity: 0.7 } : null]}
            disabled={loading}
            onPress={() => void changePassword()}
          >
            <Text style={authStyles.secondaryText}>Change app passphrase</Text>
          </Pressable>

          <TextInput
            style={authStyles.input}
            placeholder="Duress passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={duressPassword}
            onChangeText={(text) => {
              setDuressPassword(text);
              setError(null);
            }}
          />

          <TextInput
            style={authStyles.input}
            placeholder="Confirm duress passphrase"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmDuressPassword}
            onChangeText={(text) => {
              setConfirmDuressPassword(text);
              setError(null);
            }}
          />

          <Pressable
            style={[authStyles.secondaryButton, loading ? { opacity: 0.7 } : null]}
            disabled={loading}
            onPress={() => void updateDuressPassword()}
          >
            <Text style={authStyles.secondaryText}>Update duress passphrase</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
