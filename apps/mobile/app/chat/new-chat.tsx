import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  normalizePublicId,
  validatePublicId,
  type SendContactRequestRequest,
  type SendContactRequestResponse,
} from "@loki/shared";
import { apiPost } from "../../lib/apiClient";

const MAX_FIRST_MESSAGE_LENGTH = 200;

export default function NewChatScreen() {
  const [publicId, setPublicId] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [isDeviceSpecific, setIsDeviceSpecific] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  const normalized = normalizePublicId(publicId);
  const validation = publicId.trim() ? validatePublicId(normalized) : null;
  const isFormatValid = validation?.valid === true;

  const handlePublicIdChange = (text: string) => {
    setPublicId(text);
    if (formatError) setFormatError(null);
  };

  const handlePublicIdBlur = () => {
    if (!publicId.trim()) return;
    const result = validatePublicId(normalizePublicId(publicId));
    if (!result.valid) {
      switch (result.reason) {
        case "too_short":
        case "too_long":
          setFormatError("Must be 8–24 characters.");
          break;
        case "invalid_format":
          setFormatError(
            "Letters, numbers, and single hyphens only. Must start with a letter."
          );
          break;
        case "reserved":
          setFormatError("That ID is reserved.");
          break;
        case "confusable":
          setFormatError("That ID contains ambiguous characters.");
          break;
        default:
          setFormatError("Invalid format.");
      }
    } else {
      setFormatError(null);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const payload: SendContactRequestRequest = {
        recipient_public_id: normalized,
        device_specific: isDeviceSpecific,
      };
      if (firstMessage.trim()) {
        payload.first_message = firstMessage.trim();
      }
      await apiPost<SendContactRequestResponse>(
        "/contact-request/send",
        payload,
        token
      );
    } catch {
      // Swallow — modal closes silently regardless (anti-enumeration)
    } finally {
      setLoading(false);
      router.back();
    }
  };

  const sendDisabled = loading || !publicId.trim() || !isFormatValid;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>New Chat</Text>
      <Text style={styles.subheading}>
        Enter the exact Public ID of the person you want to contact.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Public ID</Text>
        <TextInput
          style={[styles.input, formatError ? styles.inputError : null]}
          placeholder="e.g. dancing-panda927"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          value={publicId}
          onChangeText={handlePublicIdChange}
          onBlur={handlePublicIdBlur}
          returnKeyType="next"
        />
        {formatError ? (
          <Text style={styles.errorText}>{formatError}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          First message{" "}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Say hello…"
          placeholderTextColor="#64748b"
          multiline
          maxLength={MAX_FIRST_MESSAGE_LENGTH}
          value={firstMessage}
          onChangeText={setFirstMessage}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {firstMessage.length}/{MAX_FIRST_MESSAGE_LENGTH}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.label}>Device-specific chat</Text>
            <Text style={styles.helperText}>
              Only accessible on this device. Cannot be changed later.
            </Text>
          </View>
          <Switch
            value={isDeviceSpecific}
            onValueChange={setIsDeviceSpecific}
            trackColor={{ false: "#334155", true: "#60a5fa" }}
            thumbColor={isDeviceSpecific ? "#2563eb" : "#cbd5e1"}
          />
        </View>
        {isDeviceSpecific ? (
          <View style={styles.infoBox}>
            <Ionicons name="lock-closed-outline" size={16} color="#60a5fa" />
            <Text style={styles.infoText}>
              This chat will not appear on any other linked device and cannot be
              recovered if this device is lost.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.sendButton, sendDisabled && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={sendDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send Request</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subheading: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  optional: {
    color: "#64748b",
    fontWeight: "400",
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
  },
  charCount: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
  },
  toggleTextWrap: {
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#0f2336",
    borderColor: "#1e4a72",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    color: "#60a5fa",
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
  sendButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
