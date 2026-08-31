import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  hasVideo: boolean;
  isVideoEnabled: boolean;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  isSpeakerOn: boolean;
  onToggleSpeaker: () => void;
  onLeave: () => void;
}

export default function CallControls({
  isMuted,
  onToggleMute,
  hasVideo,
  isVideoEnabled,
  onToggleVideo,
  onSwitchCamera,
  isSpeakerOn,
  onToggleSpeaker,
  onLeave,
}: CallControlsProps) {
  return (
    <View style={styles.row}>
      <Pressable style={[styles.button, isMuted && styles.buttonActive]} onPress={onToggleMute}>
        <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
      </Pressable>

      <Pressable style={[styles.button, isSpeakerOn && styles.buttonActive]} onPress={onToggleSpeaker}>
        <Ionicons name={isSpeakerOn ? "volume-high" : "volume-medium-outline"} size={24} color="#fff" />
      </Pressable>

      {hasVideo && (
        <>
          <Pressable style={[styles.button, !isVideoEnabled && styles.buttonActive]} onPress={onToggleVideo}>
            <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.button} onPress={onSwitchCamera}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </Pressable>
        </>
      )}

      <Pressable style={[styles.button, styles.leaveButton]} onPress={onLeave}>
        <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#334155",
  },
  leaveButton: {
    backgroundColor: "#dc2626",
  },
});
