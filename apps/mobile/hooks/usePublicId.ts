import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet } from "../lib/apiClient";
import type { PublicIdStatusResponse } from "@loki/shared";

export interface PublicIdState {
  id: string | null;
  eligibleForFreeRotationAt: Date | null;
  loading: boolean;
  error: string | null;
}

export function usePublicId() {
  const [state, setState] = useState<PublicIdState>({
    id: null,
    eligibleForFreeRotationAt: null,
    loading: false,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = await AsyncStorage.getItem("authToken");
      const { ok, status, data } = await apiGet<PublicIdStatusResponse>(
        "/public-id/status",
        token
      );

      if (ok) {
        setState({
          id: data.id,
          eligibleForFreeRotationAt: new Date(data.eligible_for_free_rotation_at),
          loading: false,
          error: null,
        });
      } else if (status === 404) {
        setState({ id: null, eligibleForFreeRotationAt: null, loading: false, error: null });
      } else {
        setState((s) => ({ ...s, loading: false, error: "Could not load Public-ID." }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Connection error." }));
    }
  }, []);

  return { ...state, fetchStatus };
}
