import Link from "next/link";
import Art from "./Art";
export default function RestaurantCard({ r }: { r: any }) {
  return (<Link href={`/r/${r.slug}`} className="group card block overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
    <div className="relative aspect-[16/10] overflow-hidden bg-soft">{r.cover_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Art seed={r.slug} kind="cover" className="h-full w-full" />}
      <span className={`absolute left-3 top-3 chip ${r.is_open ? "bg-leaf text-white" : "bg-white text-muted"}`}>{r.is_open ? "Open now" : "Closed"}</span>{r.veg_only && <span className="absolute right-3 top-3 chip bg-white text-leaf">Pure veg</span>}</div>
    <div className="p-4"><h3 className="text-xl group-hover:text-chilli">{r.name}</h3><p className="mt-1 line-clamp-1 text-sm text-muted">{(r.cuisines || []).join(" · ") || r.tagline}</p>
      <p className="mt-3 text-xs font-bold text-muted">{r.areas?.name} · {r.prep_minutes}+ min{r.min_order_paise ? ` · Min ₹${r.min_order_paise / 100}` : ""}</p></div></Link>);
}
