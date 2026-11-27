import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { myRestaurant } from "@/lib/session";
export const dynamic = "force-dynamic";
/** Cheap poll for the restaurant dashboard: how many orders are waiting to be accepted. */
export async function GET() {
  const r = await myRestaurant(); if (!r) return NextResponse.json({ waiting: 0 });
  const { count } = await db().from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", r.id).eq("status", "placed");
  return NextResponse.json({ waiting: count || 0 });
}
