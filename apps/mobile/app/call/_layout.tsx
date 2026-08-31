import { Stack } from "expo-router";

export default function CallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0f172a" } }}>
      <Stack.Screen name="outgoing" />
      <Stack.Screen name="incoming" />
      <Stack.Screen name="active" />
      <Stack.Screen name="group-call" />
    </Stack>
  );
}
