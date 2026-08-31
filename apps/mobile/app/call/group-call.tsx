import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MediaStream } from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CallStateResponse, CallType, IceServer } from "@loki/shared";
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
import ParticipantGrid, { ParticipantTile } from "./components/ParticipantGrid";

const REMOTE_STATE_POLL_MS = 3000;

// Mesh call (up to 8 participants, ADR-007). Every pair of participants
// negotiates its own RTCPeerConnection directly — there's no SFU. To avoid
// both sides of a pair racing to send an offer ("glare"), the lower
// Public-ID in lexicographic order always offers; the other side waits for
// it. This also drives late join: the periodic state poll below adds a peer
// connection for any newly-joined participant using the same rule, so it
// works symmetrically without a central coordinator.
export default function GroupCallScreen() {
  const params = useLocalSearchParams<{
    callId: string;
    type: CallType;
    amIInitiator: string;
    displayName: string;
    memberPublicIds: string;
  }>();
  const hasVideo = params.type === "video";
  const initialRemoteIds = params.memberPublicIds ? params.memberPublicIds.split(",").filter(Boolean) : [];

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [connStates, setConnStates] = useState<Record<string, string>>({});
  const [isMuted, setMuted] = useState(false);
  const [isVideoEnabled, setVideoEnabled] = useState(hasVideo);
  const [isSpeakerOn, setSpeakerOn] = useState(hasVideo);

  const peersRef = useRef<Map<string, CallPeer>>(new Map());
  const pollerRef = useRef<SignalPoller | null>(null);
  const remotePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);
  const myPublicIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<IceServer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const everConnectedRef = useRef(false);
  const startedAtRef = useRef(new Date().toISOString());
  const leftRef = useRef(false);

  const ensurePeerFor = (remoteId: string) => {
    if (peersRef.current.has(remoteId) || !myPublicIdRef.current || !localStreamRef.current) return;

    const peer = new CallPeer({
      token: tokenRef.current,
      callId: params.callId,
      remotePublicId: remoteId,
      iceServers: iceServersRef.current,
      localStream: localStreamRef.current,
      onRemoteStream: (stream) => setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream })),
      onConnectionStateChange: (state) => {
        setConnStates((prev) => ({ ...prev, [remoteId]: state }));
        if (state === "connected") everConnectedRef.current = true;
      },
    });
    peersRef.current.set(remoteId, peer);

    if (myPublicIdRef.current < remoteId) peer.createAndSendOffer();
  };

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const token = await AsyncStorage.getItem("authToken");
      tokenRef.current = token;

      InCallManager.start({ media: hasVideo ? "video" : "audio" });
      InCallManager.setForceSpeakerphoneOn(hasVideo);

      const [iceServers, stream] = await Promise.all([fetchIceServers(token), getLocalStream(hasVideo)]);
      if (cancelled) return;
      iceServersRef.current = iceServers;
      localStreamRef.current = stream;
      setLocalStream(stream);

      const { ok, data } = await apiGet<CallStateResponse>(`/calls/${params.callId}/state`, token);
      if (ok) {
        myPublicIdRef.current =
          data.participants.find((p) => !initialRemoteIds.includes(p.public_id))?.public_id ?? null;
      }

      const poller = new SignalPoller(token, params.callId, async (message) => {
        const peer = peersRef.current.get(message.from_public_id);
        if (!peer) return;
        const payload = JSON.parse(message.payload);
        if (message.type === "offer") await peer.handleRemoteOffer(payload);
        else if (message.type === "answer") await peer.handleRemoteAnswer(payload);
        else if (message.type === "ice-candidate") await peer.handleRemoteIceCandidate(payload);
      });
      pollerRef.current = poller;
      poller.start();

      initialRemoteIds.forEach(ensurePeerFor);

      remotePollRef.current = setInterval(async () => {
        const { ok: stateOk, data: state } = await apiGet<CallStateResponse>(
          `/calls/${params.callId}/state`,
          token
        );
        if (!stateOk) return;

        if (["ended", "declined", "missed", "failed"].includes(state.state)) {
          cleanup(false);
          return;
        }

        state.participants
          .filter((p) => p.status === "joined" && p.public_id !== myPublicIdRef.current)
          .forEach((p) => ensurePeerFor(p.public_id));
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
    peersRef.current.forEach((peer) => peer.close());
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
      isGroup: true,
      peerLabel: `Group call (${initialRemoteIds.length + 1})`,
      outcome: everConnectedRef.current ? "completed" : "failed",
      startedAt: startedAtRef.current,
      durationSeconds: everConnectedRef.current
        ? Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
        : null,
      memberPublicIds: initialRemoteIds,
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

  const tiles: ParticipantTile[] = [
    { publicId: myPublicIdRef.current ?? "me", stream: localStream, isLocal: true },
    ...initialRemoteIds.map((id) => ({
      publicId: id,
      stream: remoteStreams[id] ?? null,
      isLocal: false,
      connectionState: connStates[id],
    })),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{params.displayName}</Text>
      <ParticipantGrid participants={tiles} hasVideo={hasVideo} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: 56,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
});
