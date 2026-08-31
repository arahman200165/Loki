import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import type {
  CallSignalMessage,
  CallSignalType,
  IceServer,
  TurnCredentialsResponse,
  GetCallSignalResponse,
} from "@loki/shared";
import { apiGet, apiPost } from "../lib/apiClient";

// Sprint 8 / ADR-007: react-native-webrtc, pure P2P mesh, Metered.ca TURN-only.
// One CallPeer wraps exactly one RTCPeerConnection to one remote participant —
// a 1:1 call uses one instance, a group call (up to 8 participants) uses one
// per remote peer, all sharing the same local MediaStream.

export const fetchIceServers = async (token: string | null): Promise<IceServer[]> => {
  try {
    const { ok, data } = await apiGet<TurnCredentialsResponse>("/calls/turn-credentials", token);
    return ok && Array.isArray(data.ice_servers) ? data.ice_servers : [{ urls: "stun:stun.l.google.com:19302" }];
  } catch {
    return [{ urls: "stun:stun.l.google.com:19302" }];
  }
};

export const getLocalStream = async (video: boolean): Promise<MediaStream> => {
  return (await mediaDevices.getUserMedia({
    audio: true,
    video: video
      ? { facingMode: "user" }
      : false,
  })) as unknown as MediaStream;
};

export const switchCamera = (stream: MediaStream | null) => {
  const track = stream?.getVideoTracks()[0] as unknown as { _switchCamera?: () => void } | undefined;
  track?._switchCamera?.();
};

export const setTrackEnabled = (
  stream: MediaStream | null,
  kind: "audio" | "video",
  enabled: boolean
) => {
  const tracks = kind === "audio" ? stream?.getAudioTracks() : stream?.getVideoTracks();
  tracks?.forEach((track) => {
    track.enabled = enabled;
  });
};

interface CallPeerOptions {
  token: string | null;
  callId: string;
  remotePublicId: string;
  iceServers: IceServer[];
  localStream: MediaStream;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: string) => void;
}

export class CallPeer {
  readonly remotePublicId: string;
  readonly pc: RTCPeerConnection;
  private token: string | null;
  private callId: string;

  constructor(options: CallPeerOptions) {
    this.token = options.token;
    this.callId = options.callId;
    this.remotePublicId = options.remotePublicId;
    this.pc = new RTCPeerConnection({ iceServers: options.iceServers as any });

    options.localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, options.localStream);
    });

    // @ts-expect-error react-native-webrtc's event typings lag the DOM lib
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal("ice-candidate", JSON.stringify(event.candidate));
      }
    };
    // @ts-expect-error same as above
    this.pc.ontrack = (event) => {
      if (event.streams?.[0]) options.onRemoteStream(event.streams[0]);
    };
    this.pc.onconnectionstatechange = () => {
      options.onConnectionStateChange(this.pc.connectionState);
    };
  }

  private sendSignal(type: CallSignalType, payload: string) {
    apiPost(
      `/calls/${this.callId}/signal`,
      { type, payload, to_public_id: this.remotePublicId },
      this.token
    ).catch(() => {
      // Best-effort — a dropped signal either gets superseded by a later one
      // (ICE candidates) or surfaces as a stuck "connecting" state the user
      // can leave from.
    });
  }

  async createAndSendOffer() {
    const offer = await this.pc.createOffer({});
    await this.pc.setLocalDescription(offer);
    this.sendSignal("offer", JSON.stringify(offer));
  }

  async handleRemoteOffer(sdp: unknown) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp as any));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.sendSignal("answer", JSON.stringify(answer));
  }

  async handleRemoteAnswer(sdp: unknown) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp as any));
  }

  async handleRemoteIceCandidate(candidate: unknown) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate as any));
    } catch {
      // Late/duplicate candidates are expected and harmless to drop.
    }
  }

  close() {
    this.pc.close();
  }
}

// Polls GET /calls/:id/signal on a fixed interval and routes each message to
// the right CallPeer by from_public_id. Aggressive (short) interval is only
// safe because it's scoped to the lifetime of one active call screen.
export class SignalPoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private since: string | null = null;

  constructor(
    private token: string | null,
    private callId: string,
    private onMessage: (message: CallSignalMessage) => void,
    private intervalMs: number = 1200
  ) {}

  start() {
    this.timer = setInterval(() => this.poll(), this.intervalMs);
    this.poll();
  }

  private async poll() {
    try {
      const query = this.since ? `?since=${encodeURIComponent(this.since)}` : "";
      const { ok, data } = await apiGet<GetCallSignalResponse>(
        `/calls/${this.callId}/signal${query}`,
        this.token
      );
      if (!ok || data.signals.length === 0) return;

      for (const message of data.signals) this.onMessage(message);
      this.since = data.signals[data.signals.length - 1].created_at;
    } catch {
      // Skip this tick; the next one retries.
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
