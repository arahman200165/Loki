import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  ContactRequestSummary,
  PendingContactRequestsResponse,
  RespondContactRequestRequest,
  RespondContactRequestResponse,
} from "@loki/shared";
import { apiGet, apiPost } from "../../lib/apiClient";
import RequestCard from "../../components/RequestCard";

const MOCK_REQUESTS: ContactRequestSummary[] = [
  {
    id: "req-mock-1",
    sender_public_id: "alice-wonder88",
    first_message: "Hey! It's Alice from the conference.",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "req-mock-2",
    sender_public_id: "bob-the-builder77",
    first_message: null,
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

export default function RequestsScreen() {
  const [requests, setRequests] = useState<ContactRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const { ok, data } = await apiGet<PendingContactRequestsResponse>(
        "/contact-request/pending",
        token
      );
      if (ok) {
        setRequests(data.requests);
      } else {
        // Endpoint not yet implemented (tasks 4.1–4.3) — fall back to mock data
        setRequests(MOCK_REQUESTS);
      }
    } catch {
      setRequests(MOCK_REQUESTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleRespond = async (
    requestId: string,
    action: "accept" | "deny"
  ) => {
    // Optimistically remove from list
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const token = await AsyncStorage.getItem("authToken");
      await apiPost<RespondContactRequestResponse>(
        "/contact-request/respond",
        { request_id: requestId, action } satisfies RespondContactRequestRequest,
        token
      );
    } catch {
      // Swallow — optimistic removal already applied
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563eb"
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onAccept={() => handleRespond(item.id, "accept")}
            onDeny={() => handleRespond(item.id, "deny")}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending requests.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
  },
});
