import AsyncStorage from "@react-native-async-storage/async-storage";

// Interim local call-history store. Sprint 5.8's encrypted local SQLite
// store doesn't exist yet — this is deliberately AsyncStorage-backed JSON
// for now (low-sensitivity metadata only: direction, public-id, timestamp,
// duration, outcome). Migrate to SQLite once 5.8 lands; per the architecture
// doc, call history is local-only and the server never retains it.

const STORAGE_KEY = "callHistory";
const MAX_ENTRIES = 100;

export type CallOutcome = "completed" | "missed" | "declined" | "failed";

export interface CallHistoryEntry {
  callId: string;
  direction: "outgoing" | "incoming";
  type: "audio" | "video";
  isGroup: boolean;
  peerLabel: string; // 1:1: the other participant's Public-ID. Group: "Group call (N)".
  outcome: CallOutcome;
  startedAt: string; // ISO-8601
  durationSeconds: number | null; // null if the call never connected
  recipientPublicId?: string; // 1:1 callback target
  memberPublicIds?: string[]; // group callback target (the other participants)
}

export const listCallHistory = async (): Promise<CallHistoryEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addCallHistoryEntry = async (entry: CallHistoryEntry): Promise<void> => {
  try {
    const existing = await listCallHistory();
    const next = [entry, ...existing.filter((item) => item.callId !== entry.callId)].slice(
      0,
      MAX_ENTRIES
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort — losing a history entry isn't worth surfacing an error for.
  }
};

export const clearCallHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
