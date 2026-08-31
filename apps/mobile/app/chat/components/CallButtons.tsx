import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface CallButtonsProps {
  displayName: string;
  recipientPublicId?: string; // 1:1 call
  memberPublicIds?: string[]; // ad-hoc group call (Sprint 8 MVP — no persistent group required)
}

export default function CallButtons({
  displayName,
  recipientPublicId,
  memberPublicIds,
}: CallButtonsProps) {
  const startCall = (type: "audio" | "video") => {
    router.push({
      pathname: "/call/outgoing",
      params: {
        type,
        displayName,
        ...(recipientPublicId ? { recipientPublicId } : {}),
        ...(memberPublicIds && memberPublicIds.length > 0
          ? { memberPublicIds: memberPublicIds.join(",") }
          : {}),
      },
    });
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.button}
        hitSlop={8}
        onPress={() => startCall("audio")}
        accessibilityLabel="Start audio call"
      >
        <Ionicons name="call-outline" size={22} color="#e2e8f0" />
      </Pressable>
      <Pressable
        style={styles.button}
        hitSlop={8}
        onPress={() => startCall("video")}
        accessibilityLabel="Start video call"
      >
        <Ionicons name="videocam-outline" size={22} color="#e2e8f0" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 18,
    marginRight: 8,
  },
  button: {
    padding: 4,
  },
});
