"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./Cart";
import { rupees } from "@/lib/format";
import { openRzp } from "./PayButton";
type Q = { ok: boolean; far?: boolean; deliveryPaise?: number; gstPaise?: number; totalPaise?: number; eta?: number; distance?: number; max?: number };
const ERR: Record<string, string> = { closed: "This restaurant has just closed.", unavailable: "An item is no longer available. Please review your cart.", min: "Your order is below the restaurant's minimum.", phone: "Please enter a valid 10-digit mobile number.", address: "Please enter your full address.", area: "Please choose your area.", far: "This address is outside the delivery range.", rate: "Too many attempts. Please wait a few minutes.", online_off: "Online payment is not available right now.", cod_off: "Cash on delivery is not available.", empty: "Your cart is empty.", restaurant: "This restaurant is not available." };
export default function CheckoutForm({ areas, defaults, cod, online, email }: { areas: { slug: string; name: string; pincode?: string }[]; defaults: { name: string; phone: string; line1: string; landmark: string; area: string }; cod: boolean; online: boolean; email: string }) {
  const { lines, subtotal, slug, name, clear } = useCart();
  const [f, setF] = useState({ ...defaults, notes: "" }); const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [method, setMethod] = useState<"online" | "cod">(online ? "online" : "cod"); const [q, setQ] = useState<Q | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const timer = useRef<any>(null); const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    if (!slug || (!f.area && !pos)) { setQ(null); return; } clearTimeout(timer.current);
    timer.current = setTimeout(async () => { try { setQ(await (await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurant: slug, areaSlug: f.area, lat: pos?.lat, lng: pos?.lng, subtotalPaise: subtotal }) })).json()); } catch { setQ(null); } }, 250);
    return () => clearTimeout(timer.current);
  }, [slug, f.area, pos, subtotal]);
  if (!lines.length || !slug) return (<div className="py-16 text-center"><p className="text-muted">Your cart is empty.</p><Link href="/restaurants" className="btn btn-primary mt-4">Browse restaurants</Link></div>);
  function locate() { navigator.geolocation?.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }), () => setErr("Could not read your location. Choose your area instead."), { enableHighAccuracy: true, timeout: 8000 }); }
  async function place() {
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurant: slug, items: lines.map((l) => ({ id: l.id, qty: l.qty })), address: { line1: f.line1, landmark: f.landmark, areaSlug: f.area, pincode: areas.find((x) => x.slug === f.area)?.pincode || "", lat: pos?.lat, lng: pos?.lng }, name: f.name, phone: f.phone, notes: f.notes, method }) });
      const r = await res.json();
      if (!r.ok) { setErr(res.status === 401 ? "Please sign in again." : ERR[r.error] || "Could not place the order. Please try again."); setBusy(false); return; }
      if (method === "cod") { clear(); window.location.href = `/order/${r.code}`; return; }
      await openRzp(r, `Jamva order ${r.code}`, `/order/${r.code}?paid=1`, { name: r.name, email, contact: r.phone }, () => { setBusy(false); setErr("Payment was not completed. Your order is saved; you can retry from My orders."); }, () => { setBusy(false); setErr("Payment failed. Please try again."); });
      clear();
    } catch { setErr("Something went wrong. Please try again."); setBusy(false); }
  }
  const valid = f.name.trim().length > 1 && /^(\+?91)?[6-9]\d{9}$/.test(f.phone.replace(/[\s-]/g, "")) && f.line1.trim().length > 4 && (f.area || pos) && q?.ok;
  return (<div className="mt-6 space-y-6">
    <section className="card p-5"><h2 className="text-2xl">Delivery details</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div><label className="label">Name</label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
      <div><label className="label">Mobile number</label><input className="input" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></div>
      <div className="sm:col-span-2"><label className="label">Flat, building, street</label><input className="input" value={f.line1} onChange={(e) => set("line1", e.target.value)} autoComplete="street-address" /></div>
      <div><label className="label">Landmark (optional)</label><input className="input" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} /></div>
      <div><label className="label">Area</label><select className="input" value={f.area} onChange={(e) => set("area", e.target.value)}><option value="">Select area</option>{areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}{a.pincode ? ` · ${a.pincode}` : ""}</option>)}</select></div>
      <div className="sm:col-span-2"><button type="button" onClick={locate} className="text-sm font-extrabold text-chilli">{pos ? "✓ Using your exact location (more accurate delivery fee)" : "📍 Use my exact location for a more accurate fee"}</button></div>
      <div className="sm:col-span-2"><label className="label">Note for the restaurant (optional)</label><input className="input" value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={300} placeholder="Less spicy, no onion…" /></div></div></section>
    <section className="card p-5"><h2 className="text-2xl">Payment</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">
      {online && <label className={`cursor-pointer rounded-xl border-2 p-4 ${method === "online" ? "border-kesar bg-cream" : "border-line"}`}><input type="radio" className="mr-2" checked={method === "online"} onChange={() => setMethod("online")} /><b>Pay online</b><p className="ml-6 text-sm text-muted">UPI, cards, netbanking, wallets</p></label>}
      {cod && <label className={`cursor-pointer rounded-xl border-2 p-4 ${method === "cod" ? "border-kesar bg-cream" : "border-line"}`}><input type="radio" className="mr-2" checked={method === "cod"} onChange={() => setMethod("cod")} /><b>Cash on delivery</b><p className="ml-6 text-sm text-muted">Pay when the food arrives</p></label>}
      {!online && !cod && <p className="text-chilli">Payments are not available right now.</p>}</div></section>
    <section className="card p-5 text-sm"><h2 className="text-2xl">Bill · {name}</h2><dl className="mt-3 space-y-2"><div className="flex justify-between"><dt>Item total</dt><dd className="font-bold">{rupees(subtotal)}</dd></div>
      <div className="flex justify-between text-leaf"><dt>Platform, packaging and handling</dt><dd className="font-bold">₹0</dd></div>
      <div className="flex justify-between"><dt>Delivery fee{q?.distance ? ` (${q.distance} km)` : ""}</dt><dd className="font-bold">{q?.ok ? rupees(q.deliveryPaise) : "Choose area"}</dd></div>
      <div className="flex justify-between"><dt>GST on delivery fee</dt><dd className="font-bold">{q?.ok ? rupees(q.gstPaise) : "—"}</dd></div>
      <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold"><dt>To pay</dt><dd>{q?.ok ? rupees(q.totalPaise) : "—"}</dd></div></dl>
      {q?.far && <p className="mt-3 rounded-xl bg-soft p-3 font-semibold text-chilli">Sorry, this restaurant delivers up to {q.max} km. Your address is about {q.distance} km away.</p>}{q?.ok && q.eta ? <p className="mt-2 text-muted">Estimated delivery in about {q.eta + 15}–{q.eta + 30} minutes after the restaurant accepts.</p> : null}</section>
    {err && <p className="rounded-xl bg-soft p-3 font-semibold text-chilli">{err}</p>}
    <button disabled={busy || !valid || (!online && !cod)} onClick={place} className="btn btn-primary w-full !py-4 text-lg">{busy ? "Please wait…" : method === "online" ? `Pay ${q?.ok ? rupees(q.totalPaise) : ""}` : "Place order (cash on delivery)"}</button>
    <p className="text-center text-xs text-muted">By placing this order you agree to our <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/refunds">Refund policy</Link>.</p></div>);
}
