"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
export type Line = { id: string; name: string; price: number; veg: boolean; qty: number };
type Ctx = { slug: string | null; name: string | null; lines: Line[]; count: number; subtotal: number; add: (slug: string, name: string, l: Omit<Line, "qty">) => void; setQty: (id: string, q: number) => void; clear: () => void };
const C = createContext<Ctx>({ slug: null, name: null, lines: [], count: 0, subtotal: 0, add: () => {}, setQty: () => {}, clear: () => {} });
const KEY = "jamva-cart-v1";
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<{ slug: string | null; name: string | null; lines: Line[] }>({ slug: null, name: null, lines: [] });
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v?.lines) setS(v); } catch { /* ignore */ } }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }, [s]);
  const v = useMemo<Ctx>(() => ({
    ...s, count: s.lines.reduce((n, l) => n + l.qty, 0), subtotal: s.lines.reduce((n, l) => n + l.qty * l.price, 0),
    add: (slug, name, l) => setS((p) => { const base = p.slug === slug ? p.lines : []; const ex = base.find((x) => x.id === l.id); return { slug, name, lines: ex ? base.map((x) => x.id === l.id ? { ...x, qty: Math.min(20, x.qty + 1) } : x) : [...base, { ...l, qty: 1 }] }; }),
    setQty: (id, q) => setS((p) => { const lines = p.lines.map((x) => x.id === id ? { ...x, qty: Math.min(20, q) } : x).filter((x) => x.qty > 0); return lines.length ? { ...p, lines } : { slug: null, name: null, lines: [] }; }),
    clear: () => setS({ slug: null, name: null, lines: [] }),
  }), [s]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
export const useCart = () => useContext(C);
