import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await currentUser(); if (!u) return NextResponse.json({ items: [], unread: 0 });
  const { data } = await db().from("notifications").select("id,title,body,href,is_read,created_at").eq("user_id", u.id).order("created_at", { ascending: false }).limit(15);
  return NextResponse.json({ items: data || [], unread: (data || []).filter((n: any) => !n.is_read).length });
}
export async function POST() { const u = await currentUser(); if (!u) return NextResponse.json({ ok: false }, { status: 401 }); await db().from("notifications").update({ is_read: true }).eq("user_id", u.id).eq("is_read", false); return NextResponse.json({ ok: true }); }
