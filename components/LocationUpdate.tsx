"use client";
import { useState } from "react";
import { updateLocation } from "@/app/partner/actions";
/** Vendor taps once to move their pin to where the cart is now, optionally with a landmark line. */
export default function LocationUpdate({ landmark, labels }: { landmark: string | null; labels?: { title: string; sub: string; btn: string; ok: string } }) {
  const L = labels || { title: "Cart location", sub: "Move your pin whenever the cart moves. Add a landmark so customers find you.", btn: "📍 Update my location now", ok: L.ok };
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [lm, setLm] = useState(landmark || "");
  function go() {
    if (!navigator.geolocation) return setMsg("This phone cannot share its location.");
    setBusy(true); setMsg("");
    navigator.geolocation.getCurrentPosition(async (p) => { const ok = await updateLocation(p.coords.latitude, p.coords.longitude, lm); setMsg(ok ? "Location updated. Customers see your new pin." : "Could not save. You must be in Ahmedabad."); setBusy(false); }, () => { setMsg("Location blocked. Allow location for this site in your browser."); setBusy(false); }, { enableHighAccuracy: true, timeout: 15000 });
  }
  return (<div className="card mt-4 p-4"><p className="font-bold">{L.title}</p><p className="text-sm text-muted">{L.sub}</p>
    <input value={lm} onChange={(e) => setLm(e.target.value)} maxLength={120} placeholder="e.g. Opposite Gate 2" className="input mt-2" /><button onClick={go} disabled={busy} className="btn btn-dark mt-2 !py-2 text-sm">{busy ? "Finding location…" : L.btn}</button>{msg && <p className="mt-2 text-sm font-semibold">{msg}</p>}</div>);
}
