// web/src/app/api/token/route.ts
import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import { NextRequest, NextResponse } from "next/server";

// Must match agent_name in agent.py (@server.rtc_session(agent_name="voice-agent")).
const AGENT_NAME = "voice-agent";

// Best-effort limiter. In-memory state is per server instance, so on a
// serverless host this is not a hard guarantee. The hard cap on call length
// lives in the agent.
const MAX_PER_HOUR = Number(process.env.RATE_LIMIT_PER_IP_PER_HOUR ?? 5);
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_HOUR) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "LiveKit environment variables are missing" },
      { status: 500 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many calls from your network. Please try again later." },
      { status: 429 }
    );
  }

  // Server picks the room and identity. A unique room per call matters because
  // token-based agent dispatch only happens when the room is first created.
  const room = `call-${randomUUID()}`;
  const identity = `user-${randomUUID()}`;

  const at = new AccessToken(apiKey, apiSecret, { identity, ttl: "5m" });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });
  at.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })],
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, url: wsUrl });
}