import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAYS = 7;
const MAX_PER_MINUTE = 60;
const hits = new Map<string, number[]>();
let cache: { at: number; body: unknown } | null = null;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= MAX_PER_MINUTE) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function dhakaDate(offsetDays: number) {
  return new Date(Date.now() + DHAKA_OFFSET_MS + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (cache && Date.now() - cache.at < 3000) {
    return NextResponse.json(cache.body);
  }
  try {
    const { rows } = await pool.query(
      `SELECT date, time, "isBooked" FROM "Slot"
       WHERE date >= $1 AND date <= $2
       ORDER BY date, time`,
      [dhakaDate(0), dhakaDate(DAYS - 1)]
    );
    const body = {
      slots: rows.map((r) => ({ date: r.date, time: r.time, isBooked: r.isBooked })),
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e) {
    console.error("slots query failed", e);
    return NextResponse.json({ error: "Could not load slots" }, { status: 500 });
  }
}