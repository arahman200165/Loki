import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authStyles } from "../../src/auth/ui";
import { loadAuthFlowState } from "../../src/auth/flowStore";
import { wipeAllLocalAuthData } from "../../src/auth/localWipe";

export default function WelcomeScreen() {
  const [hasDeviceIdentity, setHasDeviceIdentity] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const { notice } = useLocalSearchParams<{ notice?: string }>();

  useEffect(() => {
    const run = async () => {
      const state = await loadAuthFlowState();
      setHasDeviceIdentity(Boolean(state.deviceId && state.devicePrivateJwk));
    };
    void run();
  }, []);

  const wipeWithConfirmation = () => {
    Alert.alert(
      "Wipe local data?",
      "This removes local account and lock data from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe data",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setIsWiping(true);
              try {
                await wipeAllLocalAuthData();
                setHasDeviceIdentity(false);
                router.replace({
                  pathname: "/(auth)/welcome",
                  params: { notice: "session-reset" },
                });
              } catch {
                Alert.alert("Wipe failed", "We couldn't clear local data. Please try again.");
              } finally {
                setIsWiping(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={authStyles.container} contentContainerStyle={authStyles.scrollContent}>
      <Text style={authStyles.title}>Private messaging, built to protect your data</Text>
      <Text style={authStyles.subtitle}>
        No phone number required. No email required. Your messages and keys stay under your
        control.
      </Text>
      {notice === "session-reset" ? (
        <Text style={authStyles.helper}>Local session data was reset on this device.</Text>
      ) : null}
      {hasDeviceIdentity ? (
        <Pressable style={authStyles.primaryButton} onPress={() => router.push("/(auth)/unlock")}>
          <Text style={authStyles.primaryText}>Log back in to this device</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={hasDeviceIdentity ? authStyles.secondaryButton : authStyles.primaryButton}
        onPress={() => router.push("/(auth)/create-account-intro")}
      >
        <Text style={hasDeviceIdentity ? authStyles.secondaryText : authStyles.primaryText}>
          Create private account
        </Text>
      </Pressable>

      <Pressable
        style={hasDeviceIdentity ? authStyles.tertiaryButton : authStyles.secondaryButton}
        onPress={() => router.push("/(auth)/restore-or-add-device")}
      >
        <Text style={hasDeviceIdentity ? authStyles.tertiaryText : authStyles.secondaryText}>
          Restore existing account
        </Text>
      </Pressable>

      <Pressable
        style={authStyles.tertiaryButton}
        onPress={() =>
          Alert.alert(
            "How privacy works",
            "The app authenticates devices, not passwords. Keys are generated and stored locally.",
          )
        }
      >
        <Text style={authStyles.tertiaryText}>Learn how privacy works</Text>
      </Pressable>

      <Pressable
        style={[authStyles.tertiaryButton, isWiping ? { opacity: 0.7 } : null]}
        onPress={wipeWithConfirmation}
        disabled={isWiping}
      >
        <Text style={[authStyles.tertiaryText, { color: "#fca5a5" }]}>
          {isWiping ? "Wiping local data..." : "Wipe local data"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
