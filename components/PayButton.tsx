"use client";
import { useState } from "react";
declare global { interface Window { Razorpay?: any } }
export function loadRzp() { return new Promise<void>((ok, bad) => { if (window.Razorpay) return ok(); const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => ok(); s.onerror = () => bad(); document.body.appendChild(s); }); }
export async function openRzp(r: any, desc: string, doneUrl: string, prefill: { name?: string; email?: string; contact?: string }, onClose: () => void, onFail: () => void) {
  await loadRzp();
  const rz = new window.Razorpay({ key: r.keyId, amount: r.amountPaise, currency: "INR", name: "Jamva", description: desc, order_id: r.razorpayOrderId, prefill, theme: { color: "#F08A00" }, modal: { ondismiss: onClose },
    handler: async (resp: any) => { try { await fetch("/api/pay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) }); } catch { /* webhook will settle it */ } window.location.href = doneUrl; } });
  rz.on("payment.failed", onFail); rz.open();
}
/** Yearly listing fee for restaurants. */
export default function ListingPay({ label, doneUrl = "/partner/dashboard?paid=1" }: { label: string; doneUrl?: string }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function go() {
    setBusy(true); setMsg("");
    try { const r = await (await fetch("/api/pay/listing", { method: "POST" })).json(); if (!r.ok) { setMsg(r.error === "unavailable" ? "Online payment is not open yet. We will contact you." : r.error === "not_approved" ? "Available once your restaurant is approved." : "Could not start payment."); return setBusy(false); }
      await openRzp(r, "Jamva yearly listing", doneUrl, {}, () => setBusy(false), () => { setBusy(false); setMsg("Payment failed. You can try again."); }); } catch { setMsg("Something went wrong."); setBusy(false); }
  }
  return (<div><button onClick={go} disabled={busy} className="btn btn-primary">{busy ? "Please wait…" : label}</button>{msg && <p className="mt-2 text-sm text-chilli">{msg}</p>}</div>);
}
