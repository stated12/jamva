"use client";
import { useCart } from "./Cart";
export default function AddToCart({ slug, rname, item, open }: { slug: string; rname: string; item: { id: string; name: string; price: number; veg: boolean }; open: boolean }) {
  const { lines, add, setQty, slug: cur } = useCart(); const line = cur === slug ? lines.find((l) => l.id === item.id) : null;
  if (!open) return <span className="text-xs font-bold text-muted">Closed</span>;
  if (!line) return <button onClick={() => add(slug, rname, item)} className="rounded-full border-2 border-kesar px-5 py-1.5 text-sm font-extrabold text-kesar-dark hover:bg-kesar hover:text-white">ADD</button>;
  return (<div className="inline-flex items-center gap-3 rounded-full bg-kesar px-2 py-1 text-white"><button aria-label="Remove one" onClick={() => setQty(item.id, line.qty - 1)} className="h-7 w-7 text-xl font-bold">−</button><span className="min-w-4 text-center font-bold">{line.qty}</span><button aria-label="Add one" onClick={() => setQty(item.id, line.qty + 1)} className="h-7 w-7 text-xl font-bold">+</button></div>);
}
