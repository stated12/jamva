"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type N = { id: string; title: string; body: string | null; href: string | null; is_read: boolean; created_at: string };
export default function Bell() {
  const [items, setItems] = useState<N[]>([]); const [unread, setUnread] = useState(0); const [open, setOpen] = useState(false);
  async function load() { try { const r = await (await fetch("/api/notifications", { cache: "no-store" })).json(); setItems(r.items || []); setUnread(r.unread || 0); } catch { /* offline */ } }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  async function toggle() { const o = !open; setOpen(o); if (o && unread) { await fetch("/api/notifications", { method: "POST" }); setUnread(0); } }
  return (<div className="relative"><button onClick={toggle} aria-label="Notifications" className="relative rounded-full p-2 hover:bg-soft"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>{unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-chilli px-1 text-[11px] font-extrabold text-white">{unread}</span>}</button>
    {open && <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"><p className="border-b border-line px-4 py-2 text-sm font-extrabold">Notifications</p>
      <div className="max-h-96 divide-y divide-line overflow-auto">{items.length === 0 && <p className="p-4 text-sm text-muted">Nothing yet. Order updates will appear here.</p>}{items.map((n) => (<Link key={n.id} href={n.href || "/"} onClick={() => setOpen(false)} className={`block px-4 py-3 text-sm hover:bg-soft ${n.is_read ? "" : "bg-cream"}`}><p className="font-bold">{n.title}</p>{n.body && <p className="text-muted">{n.body}</p>}</Link>))}</div></div>}</div>);
}
