"use client";
import { useState } from "react";
/** Captures the phone's GPS position into hidden fields lat/lng. Optional: if it fails, the area centre is used. */
export default function GpsField({ labels }: { labels?: { pin: string; ok: string; busy: string; fail: string } }) {
  const L = labels || { pin: "📍 Pin my location (stand at your cart)", ok: "✓ Location pinned. Tap to refresh", busy: "Finding your location…", fail: "Could not read your location. You can skip this and update it later from your dashboard." };
  const [s, setS] = useState<"idle" | "busy" | "ok" | "fail">("idle"); const [pos, setPos] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  function go() { if (!navigator.geolocation) return setS("fail"); setS("busy"); navigator.geolocation.getCurrentPosition((p) => { setPos({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }); setS("ok"); }, () => setS("fail"), { enableHighAccuracy: true, timeout: 15000 }); }
  return (<div className="sm:col-span-2"><input type="hidden" name="lat" value={pos.lat} /><input type="hidden" name="lng" value={pos.lng} />
    <button type="button" onClick={go} className="btn btn-line !py-2 text-sm">{s === "busy" ? L.busy : s === "ok" ? L.ok : L.pin}</button>
    {s === "ok" && <p className="mt-1 text-xs text-leaf">Pinned at {pos.lat}, {pos.lng}</p>}{s === "fail" && <p className="mt-1 text-xs text-chilli">{L.fail}</p>}</div>);
}
