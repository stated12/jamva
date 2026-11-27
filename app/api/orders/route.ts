import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findArea } from "@/lib/data";
import { currentUser } from "@/lib/supabase-server";
import { allow } from "@/lib/ratelimit";
import { getFees, quote } from "@/lib/pricing";
import { clean, isPhone, normPhone, todayIST } from "@/lib/format";
import { announceNewOrder } from "@/lib/orders";
import { createOrderPayment } from "@/lib/payments";
export const dynamic = "force-dynamic";
const AMD = { minLat: 22.85, maxLat: 23.25, minLng: 72.35, maxLng: 72.75 };
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ ok: false, error: "login" }, { status: 401 });
  if (!(await allow("order", 12, 600, u.id))) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  let b: any; try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad" }, { status: 400 }); }
  const t = todayIST();
  const { data: r } = await db().from("restaurants").select("*, areas:jm_areas(lat,lng)").eq("slug", String(b.restaurant || "")).eq("status", "approved").or(`trial_until.gte.${t},listing_paid_until.gte.${t}`).maybeSingle();
  if (!r) return NextResponse.json({ ok: false, error: "restaurant" }, { status: 404 });
  if (!r.is_open) return NextResponse.json({ ok: false, error: "closed" }, { status: 409 });
  const want: { id: string; qty: number }[] = (Array.isArray(b.items) ? b.items : []).slice(0, 60).map((x: any) => ({ id: String(x.id), qty: Math.min(20, Math.max(1, Math.floor(Number(x.qty) || 0))) })).filter((x: any) => x.qty > 0);
  if (!want.length) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  const { data: items } = await db().from("menu_items").select("*").eq("restaurant_id", r.id).eq("is_available", true).in("id", want.map((x) => x.id));
  const byId = new Map<string, any>((items || []).map((i: any) => [i.id, i]));
  if (want.some((w) => !byId.has(w.id))) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
  const subtotal = want.reduce((s, w) => s + byId.get(w.id).price_paise * w.qty, 0);
  if (subtotal < (r.min_order_paise || 0)) return NextResponse.json({ ok: false, error: "min", min: r.min_order_paise }, { status: 409 });
  const a = b.address || {}; const phone = normPhone(clean(b.phone, 20)); if (!isPhone(phone)) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
  const line1 = clean(a.line1, 200); if (line1.length < 5) return NextResponse.json({ ok: false, error: "address" }, { status: 400 });
  const area = await findArea(String(a.areaSlug || ""));
  let lat = Number(a.lat), lng = Number(a.lng);
  if (!(lat > AMD.minLat && lat < AMD.maxLat && lng > AMD.minLng && lng < AMD.maxLng)) { if (!area) return NextResponse.json({ ok: false, error: "area" }, { status: 400 }); lat = area.lat; lng = area.lng; }
  const from = r.lat && r.lng ? { lat: r.lat, lng: r.lng } : r.areas ? { lat: r.areas.lat, lng: r.areas.lng } : null;
  if (!from) return NextResponse.json({ ok: false, error: "restaurant_location" }, { status: 409 });
  const fees = await getFees(); const q = quote(fees, from, { lat, lng }, subtotal);
  if (!q.ok) return NextResponse.json({ ok: false, error: "far", distance: q.distance, max: fees.max_km }, { status: 409 });
  const method = b.method === "cod" ? "cod" : "online";
  if (method === "cod" && !fees.cod_enabled) return NextResponse.json({ ok: false, error: "cod_off" }, { status: 409 });
  if (method === "online" && !fees.online_enabled) return NextResponse.json({ ok: false, error: "online_off" }, { status: 409 });
  const address = { line1, landmark: clean(a.landmark, 120), area: area?.name || "", areaSlug: area?.slug || "", pincode: clean(a.pincode, 8), lat, lng };
  const { data: o, error } = await db().from("orders").insert({ customer_id: u.id, restaurant_id: r.id, status: method === "cod" ? "placed" : "pending_payment", payment_method: method, payment_status: method === "cod" ? "cod_due" : "pending",
    subtotal_paise: subtotal, delivery_fee_paise: q.deliveryPaise, delivery_gst_paise: q.gstPaise, total_paise: q.totalPaise, distance_km: q.distance, eta_minutes: (r.prep_minutes || 25) + q.eta - 20,
    address, customer_name: clean(b.name, 80), customer_phone: phone, notes: clean(b.notes, 300) || null, placed_at: method === "cod" ? new Date().toISOString() : null }).select("*").single();
  if (error || !o) return NextResponse.json({ ok: false, error: "save" }, { status: 500 });
  await db().from("order_items").insert(want.map((w) => { const i = byId.get(w.id); return { order_id: o.id, item_id: i.id, name: i.name, price_paise: i.price_paise, qty: w.qty, is_veg: i.is_veg }; }));
  await db().from("order_events").insert({ order_id: o.id, status: o.status, note: method === "cod" ? "Cash on delivery" : "Waiting for payment" });
  await db().from("profiles").update({ phone, full_name: clean(b.name, 80) || undefined }).eq("id", u.id);
  if (method === "cod") { await announceNewOrder({ ...o, restaurants: r }); return NextResponse.json({ ok: true, code: o.code }); }
  const pay = await createOrderPayment(o, u.id);
  if (!pay.ok) { await db().from("orders").update({ status: "cancelled", cancel_reason: "Payment unavailable" }).eq("id", o.id); return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 }); }
  return NextResponse.json({ ...pay, code: o.code, name: clean(b.name, 80), phone });
}
