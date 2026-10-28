"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useCallback, useState } from "react";

function CallStatus() {
  const room = useRoomContext();
  return (
    <div className="text-center text-sm text-gray-400 mb-4">
      {room.state === "connected" ? "Connected – speak now" : "Connecting…"}
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const startCall = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/token", {
      method: "POST",
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `API returned invalid JSON. Status: ${res.status}. Response: ${text || "(empty)"}`
      );
    }

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status}: ${data.error || "Unknown API error"}`
      );
    }

    setToken(data.token);
    setUrl(data.url);
    
      if (data.error) throw new Error(data.error);
      setToken(data.token);
      setUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to get token. Check your LiveKit keys.");
      setConnecting(false);
    }
  }, []);

  const endCall = useCallback(() => {
    setToken(null);
    setUrl(null);
    setConnecting(false);
  }, []);

  if (token && url) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-semibold mb-2">Voice Agent Demo</h1>
        <LiveKitRoom
          token={token}
          serverUrl={url}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={endCall}
          className="w-full max-w-md"
        >
          <CallStatus />
          <RoomAudioRenderer />
          <ControlBar controls={{ camera: false, screenShare: false }} />
        </LiveKitRoom>
        <button
          onClick={endCall}
          className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
        >
          End Call
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">Voice Agent Demo</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Click the button and talk to the AI assistant. You can check availability
        and book appointment slots.
      </p>
      <button
        onClick={startCall}
        disabled={connecting}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-lg font-medium"
      >
        {connecting ? "Connecting…" : "Start Call"}
      </button>
    </div>
  );
}