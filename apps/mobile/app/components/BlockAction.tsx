import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { apiPost } from "../../lib/apiClient";
import type { BlockContactRequest, BlockContactResponse } from "@loki/shared";

interface BlockActionProps {
  targetPublicId: string;
  requestId?: string;
  onBlocked?: () => void;
}

export default function BlockAction({
  targetPublicId,
  requestId,
  onBlocked,
}: BlockActionProps) {
  const handleBlock = () => {
    Alert.alert(
      "Block this contact?",
      "They will not be able to send you messages or requests.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              const payload: BlockContactRequest = {
                target_public_id: targetPublicId,
              };
              if (requestId) {
                payload.request_id = requestId;
              }
              await apiPost<BlockContactResponse>(
                "/contact-request/block",
                payload,
                token
              );
            } catch {
              // Swallow — onBlocked fires regardless
            } finally {
              onBlocked?.();
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable onPress={handleBlock} style={styles.pressable} hitSlop={8}>
      <Text style={styles.text}>Block</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  text: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
});
