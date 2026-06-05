import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#0f172a" },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="explainer" options={{ title: "How Loki works" }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="recovery" options={{ title: "Recovery setup" }} />
    </Stack>
  );
}
