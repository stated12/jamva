"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
/** Rider app: polls for open deliveries, beeps and refreshes the list when a new one appears. */
export default function JobAlert({ initial }: { initial: number }) {
  const router = useRouter(); const last = useRef(initial);
  useEffect(() => {
    const beep = () => { try { const C = (window as any).AudioContext || (window as any).webkitAudioContext; const c = new C(); [0, 0.25].forEach((t) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 660; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.2); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.22); }); } catch { /* no audio */ } };
    const t = setInterval(async () => { try { const r = await (await fetch("/api/driver/pulse", { cache: "no-store" })).json(); if (r.open > last.current) beep(); if (r.open !== last.current) router.refresh(); last.current = r.open; } catch { /* offline */ } }, 12000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
