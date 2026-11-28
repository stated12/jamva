"use client";
import { useEffect, useRef, useState } from "react";
type Pt = { lat: number; lng: number; heading: number | null; speed: number | null; accuracy: number | null; at: number };
/** Rider app: shares the rider's position while they have an active delivery. Handles blocked permission, no signal (keeps the latest point and sends it when back online) and keeps the screen awake. */
export default function GpsReporter({ active, labels }: { active: boolean; labels: { sharing: string; blocked: string; offline: string; unsupported: string; searching: string } }) {
  const [state, setState] = useState<"idle" | "searching" | "sharing" | "blocked" | "offline" | "unsupported">("idle");
  const pending = useRef<Pt | null>(null); const lastSent = useRef(0); const wl = useRef<any>(null);
  useEffect(() => {
    if (!active) { setState("idle"); return; }
    if (!("geolocation" in navigator)) { setState("unsupported"); return; }
    let dead = false; setState("searching");
    const send = async () => {
      const p = pending.current; if (!p) return;
      if (!navigator.onLine) { setState("offline"); return; }
      try { const r = await fetch("/api/driver/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p), keepalive: true }); if (r.ok) { pending.current = null; lastSent.current = Date.now(); setState("sharing"); } else setState("offline"); }
      catch { setState("offline"); }
    };
    const id = navigator.geolocation.watchPosition((pos) => {
      pending.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading, speed: pos.coords.speed, accuracy: pos.coords.accuracy, at: Date.now() };
      if (Date.now() - lastSent.current >= 9000) send();
    }, (e) => { if (e.code === 1) setState("blocked"); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    const flush = setInterval(() => { if (!dead && pending.current && Date.now() - lastSent.current >= 9000) send(); }, 5000);
    const back = () => send(); window.addEventListener("online", back);
    const keepAwake = async () => { try { wl.current = await (navigator as any).wakeLock?.request("screen"); } catch { /* optional */ } };
    keepAwake(); const vis = () => { if (!document.hidden) keepAwake(); }; document.addEventListener("visibilitychange", vis);
    return () => { dead = true; navigator.geolocation.clearWatch(id); clearInterval(flush); window.removeEventListener("online", back); document.removeEventListener("visibilitychange", vis); try { wl.current?.release(); } catch { /* ignore */ } };
  }, [active]);
  if (state === "idle") return null;
  const tone = state === "sharing" ? "bg-leaf-soft text-leaf" : state === "searching" ? "bg-soft text-muted" : "bg-soft text-chilli";
  const text = { sharing: labels.sharing, blocked: labels.blocked, offline: labels.offline, unsupported: labels.unsupported, searching: labels.searching }[state];
  return <p className={`mb-3 rounded-xl p-3 text-sm font-semibold ${tone}`} role="status">📍 {text}</p>;
}
