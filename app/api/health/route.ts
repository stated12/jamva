import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
/** For uptime monitors (UptimeRobot, Better Stack, Vercel checks): 200 when the database answers, 503 when it does not. No private data. */
export async function GET() {
  const t = Date.now();
  try { const { error } = await db().from("settings").select("key").limit(1); if (error) throw error; return NextResponse.json({ ok: true, ms: Date.now() - t }); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
