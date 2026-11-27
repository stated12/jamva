"use client";
import { useEffect, useState } from "react";
const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
/** Turns on browser/phone push alerts for this device (needs the VAPID public key). */
export default function PushButton({ label = "Turn on order alerts" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "on" | "off" | "unsupported">("idle"); const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  useEffect(() => { if (!key || !("serviceWorker" in navigator) || !("PushManager" in window)) setState("unsupported"); else if (Notification.permission === "granted") setState("on"); }, [key]);
  async function enable() {
    try {
      const perm = await Notification.requestPermission(); if (perm !== "granted") return setState("off");
      const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key!) as BufferSource });
      await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) }); setState("on");
    } catch { setState("off"); }
  }
  if (state === "unsupported") return null;
  if (state === "on") return <span className="chip bg-leaf-soft text-leaf">✓ Alerts on for this device</span>;
  return <button onClick={enable} className="btn btn-line !py-2 text-sm">{state === "off" ? "Alerts blocked. Retry" : label}</button>;
}
