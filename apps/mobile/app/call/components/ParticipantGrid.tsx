import { StyleSheet, Text, View } from "react-native";
import { RTCView, MediaStream } from "react-native-webrtc";

export interface ParticipantTile {
  publicId: string;
  stream: MediaStream | null;
  isLocal: boolean;
  connectionState?: string;
}

interface ParticipantGridProps {
  participants: ParticipantTile[];
  hasVideo: boolean;
}

export default function ParticipantGrid({ participants, hasVideo }: ParticipantGridProps) {
  return (
    <View style={styles.grid}>
      {participants.map((participant) => (
        <View key={participant.publicId} style={styles.tile}>
          {hasVideo && participant.stream ? (
            <RTCView
              streamURL={participant.stream.toURL()}
              style={styles.video}
              objectFit="cover"
              mirror={participant.isLocal}
              zOrder={participant.isLocal ? 1 : 0}
            />
          ) : (
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{participant.publicId.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          )}
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>
              {participant.isLocal ? "You" : participant.publicId}
            </Text>
            {!participant.isLocal && participant.connectionState === "connecting" && (
              <Text style={styles.connecting}>Connecting…</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
  },
  tile: {
    width: "50%",
    aspectRatio: 3 / 4,
    padding: 4,
  },
  video: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  avatarWrap: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  labelRow: {
    position: "absolute",
    left: 12,
    bottom: 8,
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  connecting: {
    color: "#94a3b8",
    fontSize: 11,
  },
});
