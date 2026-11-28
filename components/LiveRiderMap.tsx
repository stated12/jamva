"use client";
import { useEffect, useRef, useState } from "react";
import { rt } from "@/lib/realtime";
type Loc = { lat: number; lng: number; updated_at: string };
/** Customer view: the rider's live position on a map, moving as it changes. Falls back to polling every 15 s if the live connection is down. */
export default function LiveRiderMap({ orderId, dest, shop, labels }: { orderId: string; dest: { lat: number; lng: number } | null; shop: { lat: number; lng: number } | null; labels: { title: string; waiting: string; updated: string; paused: string } }) {
  const el = useRef<HTMLDivElement>(null); const state = useRef<{ L?: any; map?: any; rider?: any }>({}); const [loc, setLoc] = useState<Loc | null>(null); const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const sb = rt(); if (!sb) return; let ch: any; let poll: any; let dead = false;
    const read = async () => { const { data } = await sb.from("jm_driver_locations").select("lat,lng,updated_at").eq("order_id", orderId).maybeSingle(); if (!dead && data) setLoc(data); };
    read();
    ch = sb.channel("loc-" + orderId + Math.random().toString(36).slice(2, 6)).on("postgres_changes", { event: "*", schema: "public", table: "jm_driver_locations", filter: `order_id=eq.${orderId}` }, (p: any) => { if (p.new?.lat) setLoc(p.new); }).subscribe((s: string) => { clearInterval(poll); if (s !== "SUBSCRIBED") poll = setInterval(read, 15000); else read(); });
    return () => { dead = true; clearInterval(poll); try { sb.removeChannel(ch); } catch { /* ignore */ } };
  }, [orderId]);
  useEffect(() => {
    let dead = false;
    const draw = () => {
      const L = (window as any).L; if (dead || !L || !el.current || state.current.map) return;
      const start = loc || dest || shop || { lat: 23.03, lng: 72.57 };
      const map = L.map(el.current).setView([start.lat, start.lng], 14); state.current = { L, map };
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      if (dest) L.circleMarker([dest.lat, dest.lng], { radius: 9, color: "#1f6b43", weight: 3, fillColor: "#fff", fillOpacity: 1 }).addTo(map).bindTooltip("You");
      if (shop) L.circleMarker([shop.lat, shop.lng], { radius: 8, color: "#7A1D11", weight: 2, fillColor: "#F08A00", fillOpacity: 1 }).addTo(map).bindTooltip("Restaurant");
    };
    if ((window as any).L) draw(); else {
      if (!document.getElementById("leaflet-css")) { const css = document.createElement("link"); css.id = "leaflet-css"; css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css); }
      let s = document.getElementById("leaflet-js") as HTMLScriptElement | null; if (!s) { s = document.createElement("script"); s.id = "leaflet-js"; s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; document.body.appendChild(s); } s.addEventListener("load", draw);
    }
    return () => { dead = true; try { state.current.map?.remove(); } catch { /* ignore */ } state.current = {}; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { L, map } = state.current; if (!L || !map || !loc) return;
    if (!state.current.rider) { state.current.rider = L.marker([loc.lat, loc.lng], { icon: L.divIcon({ className: "", html: '<div style="font-size:26px;line-height:26px">🛵</div>', iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(map); map.setView([loc.lat, loc.lng], 15); }
    else state.current.rider.setLatLng([loc.lat, loc.lng]);
  }, [loc]);
  const age = loc ? Math.max(0, Math.round((now - new Date(loc.updated_at).getTime()) / 1000)) : null;
  return (<div className="card mt-4 overflow-hidden"><div className="p-4 pb-2"><p className="font-bold">{labels.title}</p><p className="text-xs text-muted">{age === null ? labels.waiting : age > 90 ? labels.paused : labels.updated.replace("{s}", String(age))}</p></div>
    <div ref={el} className="h-72 w-full bg-soft" role="region" aria-label={labels.title} /></div>);
}
