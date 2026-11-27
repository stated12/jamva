"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
/** Restaurant dashboard: polls for waiting orders, beeps and refreshes the list when a new one arrives. */
export default function NewOrderAlert({ initial }: { initial: number }) {
  const router = useRouter(); const last = useRef(initial); const [muted, setMuted] = useState(false); const [armed, setArmed] = useState(false);
  function beep() { try { const C = (window as any).AudioContext || (window as any).webkitAudioContext; const c = new C(); [0, 0.25, 0.5].forEach((t) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.2); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.22); }); } catch { /* no audio */ } }
  useEffect(() => { const t = setInterval(async () => { try { const r = await (await fetch("/api/partner/pulse", { cache: "no-store" })).json(); if (r.waiting > last.current && !muted) beep(); if (r.waiting !== last.current) router.refresh(); last.current = r.waiting; } catch { /* offline */ } }, 10000); return () => clearInterval(t); }, [router, muted]);
  return (<div className="flex flex-wrap items-center gap-3 text-xs font-bold"><button onClick={() => { setArmed(true); beep(); }} className="chip">{armed ? "🔔 Sound ready" : "🔔 Test alert sound"}</button><button onClick={() => setMuted(!muted)} className="chip">{muted ? "Unmute" : "Mute"}</button></div>);
}
