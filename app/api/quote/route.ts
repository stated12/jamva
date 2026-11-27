import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findArea } from "@/lib/data";
import { getFees, quote } from "@/lib/pricing";
export const dynamic = "force-dynamic";
/** Public fee preview for the cart. The real price is always recomputed when the order is placed. */
export async function POST(req: Request) {
  let b: any; try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const { data: r } = await db().from("restaurants").select("lat,lng,areas:jm_areas(lat,lng)").eq("slug", String(b.restaurant || "")).eq("status", "approved").maybeSingle();
  const a = await findArea(String(b.areaSlug || ""));
  if (!r) return NextResponse.json({ ok: false }, { status: 404 });
  let lat = Number(b.lat), lng = Number(b.lng); if (!(lat > 22.85 && lat < 23.25 && lng > 72.35 && lng < 72.75)) { if (!a) return NextResponse.json({ ok: false }, { status: 400 }); lat = a.lat; lng = a.lng; }
  const from = r.lat && r.lng ? { lat: r.lat, lng: r.lng } : (r as any).areas;
  if (!from) return NextResponse.json({ ok: false }, { status: 409 });
  const fees = await getFees(); const q = quote(fees, from, { lat, lng }, Math.max(0, Math.floor(Number(b.subtotalPaise) || 0)));
  return NextResponse.json(q.ok ? q : { ok: false, far: true, distance: q.distance, max: fees.max_km });
}
