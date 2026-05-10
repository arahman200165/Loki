import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { apiGet } from "../../src/auth/api";
import { loadAuthFlowState } from "../../src/auth/flowStore";

type LinkStatusResponse = {
  status: "pending" | "approved" | "expired" | "denied";
  encrypted_bootstrap_bundle?: string;
};

export default function WaitingApprovalScreen() {
  const [status, setStatus] = useState("Waiting for approval");
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const state = await loadAuthFlowState();
      if (!state.linkSessionId) {
        setStatus("Link session missing");
        setRunning(false);
        return;
      }

      while (!cancelled) {
        try {
          const data = await apiGet<LinkStatusResponse>(
            `/v1/devices/link/status?link_session_id=${encodeURIComponent(state.linkSessionId)}`,
          );
          if (data.status === "approved") {
            setStatus("Approval received");
            await new Promise((resolve) => setTimeout(resolve, 500));
            setStatus("Secure transfer in progress");
            setRunning(false);
            router.replace("/(auth)/device-approved");
            return;
          }
          if (data.status === "expired") {
            setStatus("Link session expired");
            setRunning(false);
            return;
          }
          if (data.status === "denied") {
            setStatus("Link request denied");
            setRunning(false);
            return;
          }

          setStatus("Waiting for approval");
        } catch {
          setStatus("Waiting for approval");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Waiting for approval</Text>
      <Text style={authStyles.subtitle}>
        Approve this device from one of your signed-in devices to continue.
      </Text>
      <Text style={authStyles.body}>{status}</Text>
      {running ? <ActivityIndicator color="#fff" /> : null}
      <Pressable style={authStyles.secondaryButton} onPress={() => router.back()}>
        <Text style={authStyles.secondaryText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}
