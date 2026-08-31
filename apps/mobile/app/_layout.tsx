import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  requestCallNotificationPermission,
  subscribeToIncomingCalls,
} from "../services/callNotificationHandler";

export default function RootLayout() {
  const seenCallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    requestCallNotificationPermission();

    const unsubscribe = subscribeToIncomingCalls(
      () => AsyncStorage.getItem("authToken"),
      (call) => {
        if (seenCallIdsRef.current.has(call.call_id)) return;
        seenCallIdsRef.current.add(call.call_id);
        router.push({
          pathname: "/call/incoming",
          params: {
            callId: call.call_id,
            type: call.type,
            initiatorPublicId: call.initiator_public_id,
          },
        });
      }
    );

    return unsubscribe;
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#0f172a" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen
        name="chat/new-chat"
        options={{
          presentation: "modal",
          title: "New Chat",
        }}
      />
      <Stack.Screen
        name="requests/index"
        options={{ title: "Contact Requests" }}
      />
      <Stack.Screen
        name="profile/manage-id"
        options={{ title: "Manage Handle" }}
      />
    </Stack>
  );
}
