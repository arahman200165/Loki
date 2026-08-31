import { StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import CallButtons from "./components/CallButtons";

// Sprint-8-only stand-in. This is NOT the Sprint 5.6 chat thread (no real
// send/receive, no encryption, no attachments) or the Sprint 7.7 group
// thread — it exists purely to give 8.4/8.7's call buttons a header to live
// in and a real Public-ID to call. It gets replaced when 5.6/7.7 land.
export default function ChatThreadScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    publicId?: string;
    isGroup?: string;
    memberPublicIds?: string;
  }>();

  const isGroup = params.isGroup === "1";
  const memberPublicIds = params.memberPublicIds ? params.memberPublicIds.split(",") : [];
  const displayName = params.name ?? "Chat";
  const subtitle = isGroup
    ? `${memberPublicIds.length} members`
    : params.publicId ?? "";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: displayName,
          headerRight: () => (
            <CallButtons
              displayName={displayName}
              recipientPublicId={isGroup ? undefined : params.publicId}
              memberPublicIds={isGroup ? memberPublicIds : undefined}
            />
          ),
        }}
      />

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          Messaging isn&apos;t wired up yet (Sprint 5/7). This screen exists so
          calling has somewhere to start from.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  subtitleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
