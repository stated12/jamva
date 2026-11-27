import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { myDriver } from "@/lib/drivers";
export const dynamic = "force-dynamic";
/** Cheap poll for the rider app: how many deliveries are open to take. Also marks the rider as recently seen. */
export async function GET() {
  const d = await myDriver(); if (!d || d.status !== "active") return NextResponse.json({ open: 0 });
  await db().from("drivers").update({ last_seen_at: new Date().toISOString() }).eq("id", d.id);
  if (!d.is_online) return NextResponse.json({ open: 0 });
  const { count } = await db().from("orders").select("id", { count: "exact", head: true }).is("driver_id", null).in("status", ["accepted", "preparing", "ready"]);
  return NextResponse.json({ open: count || 0 });
}
