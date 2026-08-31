import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CallStateResponse,
  CallType,
  InitiateCallRequest,
  InitiateCallResponse,
} from "@loki/shared";
import { apiGet, apiPost } from "../../lib/apiClient";
import { generateIdempotencyKey } from "../../lib/idempotency";
import { addCallHistoryEntry } from "../../services/callHistoryStore";

const POLL_INTERVAL_MS = 1500;
const TERMINAL_STATES = ["declined", "missed", "failed", "ended"];

export default function OutgoingCallScreen() {
  const params = useLocalSearchParams<{
    type: CallType;
    displayName: string;
    recipientPublicId?: string;
    memberPublicIds?: string;
  }>();
  const isGroup = !!params.memberPublicIds;
  const [status, setStatus] = useState<"initiating" | "ringing" | "ended">("initiating");
  const [message, setMessage] = useState<string | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    initiate();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const initiate = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const body: InitiateCallRequest = {
      type: params.type,
      ...(isGroup
        ? { recipient_public_ids: params.memberPublicIds!.split(",") }
        : { recipient_public_id: params.recipientPublicId }),
    };

    try {
      const { ok, status: httpStatus, data } = await apiPost<InitiateCallResponse>(
        "/calls/initiate",
        body,
        token,
        { idempotencyKey: generateIdempotencyKey() }
      );

      if (!ok) {
        setMessage(httpStatus === 400 ? "Can't start this call." : "Something went wrong.");
        setStatus("ended");
        return;
      }

      callIdRef.current = data.call_id;
      setStatus("ringing");
      pollRef.current = setInterval(() => pollState(token), POLL_INTERVAL_MS);
    } catch {
      setMessage("Couldn't reach the server.");
      setStatus("ended");
    }
  };

  const pollState = async (token: string | null) => {
    const callId = callIdRef.current;
    if (!callId) return;

    const { ok, data } = await apiGet<CallStateResponse>(`/calls/${callId}/state`, token);
    if (!ok) return;

    if (data.state === "active") {
      if (pollRef.current) clearInterval(pollRef.current);
      router.replace({
        pathname: isGroup ? "/call/group-call" : "/call/active",
        params: {
          callId,
          type: params.type,
          amIInitiator: "1",
          displayName: params.displayName,
          ...(isGroup
            ? { memberPublicIds: params.memberPublicIds }
            : { recipientPublicId: params.recipientPublicId }),
        },
      });
      return;
    }

    if (TERMINAL_STATES.includes(data.state)) {
      if (pollRef.current) clearInterval(pollRef.current);
      await addCallHistoryEntry({
        callId,
        direction: "outgoing",
        type: params.type,
        isGroup,
        peerLabel: params.displayName,
        outcome: data.state === "declined" ? "declined" : data.state === "missed" ? "missed" : "failed",
        startedAt: data.created_at,
        durationSeconds: null,
        ...(isGroup
          ? { memberPublicIds: params.memberPublicIds!.split(",") }
          : { recipientPublicId: params.recipientPublicId }),
      });
      setMessage(
        data.state === "declined" ? "Call declined" : data.state === "missed" ? "No answer" : "Call failed"
      );
      setStatus("ended");
      setTimeout(() => router.back(), 1500);
    }
  };

  const cancel = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const callId = callIdRef.current;
    if (pollRef.current) clearInterval(pollRef.current);
    if (callId) {
      try {
        await apiPost(`/calls/${callId}/terminate`, {}, token);
      } catch {
        // Leaving the screen regardless — the ringing timeout will clean up server-side.
      }
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{params.displayName?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{params.displayName}</Text>
        <Text style={styles.status}>
          {message ?? (status === "initiating" ? "Calling…" : "Ringing…")}
        </Text>
        {status !== "ended" && <ActivityIndicator color="#60a5fa" style={styles.spinner} />}
      </View>

      {status !== "ended" && (
        <Pressable style={styles.cancelButton} onPress={cancel}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "space-between",
    paddingVertical: 80,
  },
  center: {
    alignItems: "center",
    marginTop: 60,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  status: {
    color: "#94a3b8",
    fontSize: 15,
  },
  spinner: {
    marginTop: 20,
  },
  cancelButton: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
});
