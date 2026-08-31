import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CallStateResponse, CallType, RespondCallRequest, RespondCallResponse } from "@loki/shared";
import { apiGet, apiPost } from "../../lib/apiClient";
import { generateIdempotencyKey } from "../../lib/idempotency";
import { addCallHistoryEntry } from "../../services/callHistoryStore";

const POLL_INTERVAL_MS = 2000;

const dismiss = () => {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)/calls");
};

export default function IncomingCallScreen() {
  const params = useLocalSearchParams<{
    callId: string;
    type: CallType;
    initiatorPublicId: string;
  }>();
  const [responding, setResponding] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const respondedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const { ok, data } = await apiGet<CallStateResponse>(`/calls/${params.callId}/state`, token);
      if (cancelled || respondedRef.current || !ok) return;

      if (data.state !== "ringing") {
        // Caller cancelled, or the ringing timeout elapsed server-side.
        await addCallHistoryEntry({
          callId: params.callId,
          direction: "incoming",
          type: params.type,
          isGroup: data.participants.length > 2,
          peerLabel: params.initiatorPublicId,
          outcome: data.state === "missed" ? "missed" : "declined",
          startedAt: data.created_at,
          durationSeconds: null,
          recipientPublicId: params.initiatorPublicId,
        });
        if (pollRef.current) clearInterval(pollRef.current);
        dismiss();
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [params.callId]);

  const respond = async (accept: boolean) => {
    if (responding) return;
    setResponding(true);
    respondedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);

    const token = await AsyncStorage.getItem("authToken");
    try {
      await apiPost<RespondCallResponse>(
        `/calls/${params.callId}/respond`,
        { accept } satisfies RespondCallRequest,
        token,
        { idempotencyKey: generateIdempotencyKey() }
      );

      if (!accept) {
        await addCallHistoryEntry({
          callId: params.callId,
          direction: "incoming",
          type: params.type,
          isGroup: false,
          peerLabel: params.initiatorPublicId,
          outcome: "declined",
          startedAt: new Date().toISOString(),
          durationSeconds: null,
          recipientPublicId: params.initiatorPublicId,
        });
        dismiss();
        return;
      }

      const { ok, data } = await apiGet<CallStateResponse>(`/calls/${params.callId}/state`, token);
      const isGroup = ok && data.participants.length > 2;

      router.replace({
        pathname: isGroup ? "/call/group-call" : "/call/active",
        params: {
          callId: params.callId,
          type: params.type,
          amIInitiator: "0",
          displayName: params.initiatorPublicId,
          ...(isGroup
            ? {
                memberPublicIds: data.participants
                  .map((p) => p.public_id)
                  .filter((id) => id !== params.initiatorPublicId)
                  .join(","),
              }
            : { recipientPublicId: params.initiatorPublicId }),
        },
      });
    } catch {
      dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.incomingLabel}>
          Incoming {params.type === "video" ? "video" : "audio"} call
        </Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{params.initiatorPublicId?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{params.initiatorPublicId}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionButton, styles.decline]} onPress={() => respond(false)}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
        <Pressable style={[styles.actionButton, styles.accept]} onPress={() => respond(true)}>
          <Ionicons name="call" size={28} color="#fff" />
        </Pressable>
      </View>
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
    marginTop: 40,
  },
  incomingLabel: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  decline: {
    backgroundColor: "#dc2626",
  },
  accept: {
    backgroundColor: "#16a34a",
  },
});
