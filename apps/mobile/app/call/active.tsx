import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RTCView, MediaStream } from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CallStateResponse, CallType } from "@loki/shared";
import { apiGet, apiPost } from "../../lib/apiClient";
import { addCallHistoryEntry } from "../../services/callHistoryStore";
import {
  CallPeer,
  SignalPoller,
  fetchIceServers,
  getLocalStream,
  setTrackEnabled,
  switchCamera,
} from "../../services/webrtcClient";
import CallControls from "./components/CallControls";

type ConnState = "connecting" | "connected" | "ended" | "failed";
const REMOTE_STATE_POLL_MS = 3000;

export default function ActiveCallScreen() {
  const params = useLocalSearchParams<{
    callId: string;
    type: CallType;
    amIInitiator: string;
    displayName: string;
    recipientPublicId: string;
  }>();
  const hasVideo = params.type === "video";

  const [connState, setConnState] = useState<ConnState>("connecting");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setMuted] = useState(false);
  const [isVideoEnabled, setVideoEnabled] = useState(hasVideo);
  const [isSpeakerOn, setSpeakerOn] = useState(hasVideo);

  const peerRef = useRef<CallPeer | null>(null);
  const pollerRef = useRef<SignalPoller | null>(null);
  const remotePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);
  const everConnectedRef = useRef(false);
  const startedAtRef = useRef(new Date().toISOString());
  const leftRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const token = await AsyncStorage.getItem("authToken");
      tokenRef.current = token;

      InCallManager.start({ media: hasVideo ? "video" : "audio" });
      InCallManager.setForceSpeakerphoneOn(hasVideo);

      const [iceServers, stream] = await Promise.all([fetchIceServers(token), getLocalStream(hasVideo)]);
      if (cancelled) return;
      setLocalStream(stream);

      const peer = new CallPeer({
        token,
        callId: params.callId,
        remotePublicId: params.recipientPublicId,
        iceServers,
        localStream: stream,
        onRemoteStream: (remote) => setRemoteStream(remote),
        onConnectionStateChange: (state) => {
          if (state === "connected") {
            everConnectedRef.current = true;
            setConnState("connected");
          } else if (state === "failed") {
            setConnState("failed");
          }
        },
      });
      peerRef.current = peer;

      const poller = new SignalPoller(token, params.callId, async (message) => {
        if (message.from_public_id !== params.recipientPublicId) return;
        const payload = JSON.parse(message.payload);
        if (message.type === "offer") await peer.handleRemoteOffer(payload);
        else if (message.type === "answer") await peer.handleRemoteAnswer(payload);
        else if (message.type === "ice-candidate") await peer.handleRemoteIceCandidate(payload);
      });
      pollerRef.current = poller;
      poller.start();

      if (params.amIInitiator === "1") await peer.createAndSendOffer();

      remotePollRef.current = setInterval(async () => {
        const { ok, data } = await apiGet<CallStateResponse>(`/calls/${params.callId}/state`, token);
        if (ok && ["ended", "declined", "missed", "failed"].includes(data.state)) {
          cleanup(false);
        }
      }, REMOTE_STATE_POLL_MS);
    };

    setup();
    return () => {
      cancelled = true;
      cleanup(true);
    };
  }, []);

  const cleanup = async (notifyServer: boolean) => {
    if (leftRef.current) return;
    leftRef.current = true;

    if (remotePollRef.current) clearInterval(remotePollRef.current);
    pollerRef.current?.stop();
    peerRef.current?.close();
    InCallManager.stop();

    if (notifyServer) {
      apiPost(
        `/calls/${params.callId}/leave`,
        everConnectedRef.current ? {} : { reason: "failed" },
        tokenRef.current
      ).catch(() => {});
    }

    await addCallHistoryEntry({
      callId: params.callId,
      direction: params.amIInitiator === "1" ? "outgoing" : "incoming",
      type: params.type,
      isGroup: false,
      peerLabel: params.recipientPublicId,
      outcome: everConnectedRef.current ? "completed" : "failed",
      startedAt: startedAtRef.current,
      durationSeconds: everConnectedRef.current
        ? Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
        : null,
      recipientPublicId: params.recipientPublicId,
    });
  };

  const handleLeave = async () => {
    await cleanup(true);
    router.replace("/(tabs)/chat");
  };

  const toggleMute = () => {
    setTrackEnabled(localStream, "audio", isMuted);
    setMuted((prev) => !prev);
  };
  const toggleVideo = () => {
    setTrackEnabled(localStream, "video", !isVideoEnabled);
    setVideoEnabled((prev) => !prev);
  };
  const toggleSpeaker = () => {
    InCallManager.setForceSpeakerphoneOn(!isSpeakerOn);
    setSpeakerOn((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {hasVideo && remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
      ) : (
        <View style={styles.audioOnly}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{params.recipientPublicId?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      )}

      <View style={styles.topOverlay}>
        <Text style={styles.name}>{params.recipientPublicId}</Text>
        <Text style={styles.statusText}>
          {connState === "connecting" && "Connecting…"}
          {connState === "connected" && "Connected"}
          {connState === "failed" && "Connection failed"}
        </Text>
      </View>

      {hasVideo && localStream && isVideoEnabled && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" zOrder={1} />
      )}

      <View style={styles.controlsOverlay}>
        <CallControls
          isMuted={isMuted}
          onToggleMute={toggleMute}
          hasVideo={hasVideo}
          isVideoEnabled={isVideoEnabled}
          onToggleVideo={toggleVideo}
          onSwitchCamera={() => switchCamera(localStream)}
          isSpeakerOn={isSpeakerOn}
          onToggleSpeaker={toggleSpeaker}
          onLeave={handleLeave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  remoteVideo: {
    flex: 1,
  },
  audioOnly: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "700",
  },
  topOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statusText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  localVideo: {
    position: "absolute",
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
