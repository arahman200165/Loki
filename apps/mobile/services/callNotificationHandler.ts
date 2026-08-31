import * as Notifications from "expo-notifications";
import type { PendingCallsResponse, PendingCallSummary } from "@loki/shared";
import { apiGet } from "../lib/apiClient";

// Sprint 8.5 / ADR-013: push payloads stay content-free — no call id, no
// caller info. This module is the concrete answer to "how does the client
// learn *which* call is ringing": any wake-up (push received, push tapped,
// or just the app coming to foreground) triggers a GET /calls/pending poll.
// A slow foreground-poll fallback covers the case where a push is delayed
// or never arrives — MVP reliability is scoped to foreground/backgrounded-
// running only (ADR-007); force-quit delivery needs CallKit/PushKit, a
// documented Phase-2 gap.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestCallNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
};

const POLL_INTERVAL_MS = 5000;

const checkPendingCalls = async (
  getToken: () => Promise<string | null>,
  onIncomingCall: (call: PendingCallSummary) => void
) => {
  try {
    const token = await getToken();
    if (!token) return;
    const { ok, data } = await apiGet<PendingCallsResponse>("/calls/pending", token);
    if (ok && data.calls.length > 0) onIncomingCall(data.calls[0]);
  } catch {
    // Skip this tick; the next push or poll retries.
  }
};

// Call once from the root layout for the app's lifetime. getToken is read
// fresh on every tick (not captured once) so login/logout during the
// session don't require re-subscribing. Returns an unsubscribe function.
export const subscribeToIncomingCalls = (
  getToken: () => Promise<string | null>,
  onIncomingCall: (call: PendingCallSummary) => void
): (() => void) => {
  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    checkPendingCalls(getToken, onIncomingCall);
  });
  const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
    checkPendingCalls(getToken, onIncomingCall);
  });

  const interval = setInterval(() => checkPendingCalls(getToken, onIncomingCall), POLL_INTERVAL_MS);
  checkPendingCalls(getToken, onIncomingCall);

  return () => {
    receivedSub.remove();
    responseSub.remove();
    clearInterval(interval);
  };
};
