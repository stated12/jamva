"use client";
import { useEffect, useRef } from "react";
export type MapPin = { slug: string; name: string; lat: number; lng: number; landmark?: string | null; area?: string | null };
/** Live map of vendors that are open right now (OpenStreetMap tiles via Leaflet, no API key). */
export default function VendorMap({ pins }: { pins: MapPin[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: any; let dead = false;
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => {
      const L = (window as any).L; if (dead || !L || !el.current) return;
      map = L.map(el.current).setView([23.0300, 72.5600], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      const pts: [number, number][] = [];
      pins.forEach((p) => { pts.push([p.lat, p.lng]); const m = L.circleMarker([p.lat, p.lng], { radius: 10, color: "#7A1D11", weight: 2, fillColor: "#F08A00", fillOpacity: 0.95 }).addTo(map);
        const box = document.createElement("div"); const b = document.createElement("b"); b.textContent = p.name; const sp = document.createElement("div"); sp.textContent = p.landmark || p.area || ""; const a = document.createElement("a"); a.href = `/r/${p.slug}`; a.textContent = "See menu"; a.style.fontWeight = "700"; box.append(b, sp, a); m.bindPopup(box); });
      if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    };
    document.body.appendChild(s);
    return () => { dead = true; try { map?.remove(); } catch { /* ignore */ } };
  }, [pins]);
  return <div ref={el} className="h-80 w-full overflow-hidden rounded-2xl border border-line bg-soft" role="region" aria-label="Map of open street vendors" />;
}
