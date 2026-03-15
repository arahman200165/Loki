import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { getEntryAuthRoute } from "../src/auth/flowStore";

export default function LegacyLoginRoute() {
  const [route, setRoute] = useState<
    "/(auth)/unlock" | "/(auth)/restore-or-add-device" | "/(auth)/welcome" | null
  >(null);

  useEffect(() => {
    const run = async () => {
      const next = await getEntryAuthRoute();
      setRoute(next);
    };
    void run();
  }, []);

  if (!route) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return <Redirect href={route} />;
}
