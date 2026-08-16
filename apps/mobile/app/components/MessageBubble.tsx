import { View, Text, StyleSheet } from "react-native";

interface MessageBubbleProps {
  text: string;
  sentByMe: boolean;   // true = right side (blue), false = left side (grey)
  timestamp: string;   // ISO-8601 string, displayed as a short time
}

export default function MessageBubble({ text, sentByMe, timestamp }: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    // Outer row: align the bubble to the right if sentByMe, left if not
    <View style={[styles.row, sentByMe ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, sentByMe ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleSent: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: "#1e293b",
    borderBottomLeftRadius: 4,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    alignSelf: "flex-end",
  },
});
