import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  let s: any; try { s = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const e = s?.endpoint, p = s?.keys?.p256dh, a = s?.keys?.auth; if (typeof e !== "string" || typeof p !== "string" || typeof a !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  await db().from("push_subscriptions").upsert({ user_id: u.id, endpoint: e, p256dh: p, auth: a }, { onConflict: "endpoint" }); return NextResponse.json({ ok: true });
}
