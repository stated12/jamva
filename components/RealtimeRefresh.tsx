"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rt } from "@/lib/realtime";
export type Sub = { table: string; filter?: string };
/** Refreshes the page the moment something changes (Supabase Realtime). If the live connection drops, it falls back to polling so the screen never goes stale, and catches up when it reconnects. */
export default function RealtimeRefresh({ subs, fast = 15000, slow = 90000, showDot = true, labels }: { subs: Sub[]; fast?: number; slow?: number; showDot?: boolean; labels?: { live: string; reconnecting: string } }) {
  const router = useRouter(); const [on, setOn] = useState(false);
  const last = useRef(Date.now()); const connected = useRef(false); const debounce = useRef<any>(null);
  const L = labels || { live: "Live", reconnecting: "Reconnecting…" };
  useEffect(() => {
    const go = () => { last.current = Date.now(); router.refresh(); };
    const kick = () => { clearTimeout(debounce.current); debounce.current = setTimeout(go, 300); };
    const sb = rt(); let ch: any;
    if (sb) {
      ch = sb.channel("jv-" + subs.map((s) => s.table + (s.filter || "")).join("|") + "-" + Math.random().toString(36).slice(2, 7));
      subs.forEach((s) => ch.on("postgres_changes", { event: "*", schema: "public", table: s.table, ...(s.filter ? { filter: s.filter } : {}) }, kick));
      ch.subscribe((status: string) => { const ok = status === "SUBSCRIBED"; if (ok && !connected.current && last.current) kick(); /* catch up after a drop */ connected.current = ok; setOn(ok); });
    }
    const tick = setInterval(() => { if (document.hidden) return; if (Date.now() - last.current > (connected.current ? slow : fast)) go(); }, 5000);
    const wake = () => { if (!document.hidden) go(); };
    document.addEventListener("visibilitychange", wake); window.addEventListener("online", wake);
    return () => { clearInterval(tick); clearTimeout(debounce.current); document.removeEventListener("visibilitychange", wake); window.removeEventListener("online", wake); try { if (ch) sb.removeChannel(ch); } catch { /* ignore */ } };
  }, [router, fast, slow, JSON.stringify(subs)]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!showDot) return null;
  return <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${on ? "bg-leaf-soft text-leaf" : "bg-soft text-muted"}`} aria-live="polite"><i className={`h-2 w-2 rounded-full ${on ? "bg-leaf" : "bg-kesar"}`} />{on ? L.live : L.reconnecting}</span>;
}
