import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { myDriver } from "@/lib/drivers";
export const dynamic = "force-dynamic";
const AREA = { minLat: 6, maxLat: 37.5, minLng: 68, maxLng: 98 }; // India
/** Rider app sends its position here. Accepted only from an approved rider, and stored only for orders assigned to them that are still in progress. */
export async function POST(req: Request) {
  const d = await myDriver(); if (!d || d.status !== "active") return NextResponse.json({ ok: false }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!(lat > AREA.minLat && lat < AREA.maxLat && lng > AREA.minLng && lng < AREA.maxLng)) return NextResponse.json({ ok: false, error: "coords" }, { status: 400 });
  const n = (x: any) => (x !== null && x !== undefined && Number.isFinite(Number(x)) ? Number(x) : null);
  const { data: orders } = await db().from("orders").select("id").eq("driver_id", d.id).in("status", ["accepted", "preparing", "ready", "picked_up"]).limit(3);
  if (!orders?.length) return NextResponse.json({ ok: true, active: 0 });
  const at = Number(b.at); const stamp = new Date(Number.isFinite(at) && Math.abs(Date.now() - at) < 600000 ? at : Date.now()).toISOString();
  const rows = orders.map((o: any) => ({ order_id: o.id, driver_id: d.id, lat, lng, heading: n(b.heading), speed: n(b.speed), accuracy: n(b.accuracy), updated_at: stamp }));
  const { error } = await db().from("driver_locations").upsert(rows, { onConflict: "order_id" });
  if (error) { console.error("[gps]", error.message); return NextResponse.json({ ok: false }, { status: 500 }); }
  await db().from("drivers").update({ last_seen_at: new Date().toISOString() }).eq("id", d.id);
  return NextResponse.json({ ok: true, active: orders.length });
}
/** Rider stops sharing at the end of a shift. */
export async function DELETE() {
  const d = await myDriver(); if (!d) return NextResponse.json({ ok: false }, { status: 403 });
  await db().from("driver_locations").delete().eq("driver_id", d.id);
  return NextResponse.json({ ok: true });
}
