import { getT } from "@/lib/i18n";
import Link from "next/link";
import { listRestaurants, listAreas } from "@/lib/data";
import RestaurantCard from "@/components/RestaurantCard";
import WaitlistForm from "@/components/WaitlistForm";
export const metadata = { title: "Restaurants in Ahmedabad", description: "Order from Ahmedabad restaurants with zero commission menu prices and one honest delivery fee." };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ area?: string; q?: string; veg?: string; t?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const [areas, rs] = await Promise.all([listAreas().catch(() => []), listRestaurants({ area: sp.area, q: sp.q, veg: sp.veg === "1", limit: 60, kind: sp.t === "street" ? "street" : "restaurant" }).catch(() => [])]);
  const chip = (on: boolean) => `chip whitespace-nowrap !px-4 !py-2 text-sm ${on ? "!bg-ink text-white" : "border border-line bg-white"}`;
  const link = (o: Record<string, string | undefined>) => { const p = new URLSearchParams(); const m = { ...sp, ...o }; Object.entries(m).forEach(([k, v]) => v && p.set(k, v)); const s = p.toString(); return "/restaurants" + (s ? "?" + s : ""); };
  return (<div className="wrap py-10"><h1 className="text-4xl md:text-5xl">{sp.t === "street" ? t("rs_street") : t("rs_title")}</h1><div className="mt-4 flex gap-2"><Link href={link({ t: undefined })} className={chip(sp.t !== "street")}>{t("ft_rest")}</Link><Link href={link({ t: "street" })} className={chip(sp.t === "street")}>{t("ft_street")}</Link><Link href="/street-vendors" className="chip whitespace-nowrap !px-4 !py-2 text-sm border border-line bg-white">🗺 Map</Link></div><p className="mt-2 text-muted">Same price as the menu. One delivery fee. Zero platform fee.</p>
    <form className="mt-6 flex gap-2"><input name="q" defaultValue={sp.q} placeholder={t("rs_search")} className="input" />{sp.area && <input type="hidden" name="area" value={sp.area} />}<button className="btn btn-dark">{t("search")}</button></form>
    <form method="get" className="mt-4 flex flex-wrap items-center gap-2">{sp.t && <input type="hidden" name="t" value={sp.t} />}{sp.q && <input type="hidden" name="q" value={sp.q} />}{sp.veg && <input type="hidden" name="veg" value={sp.veg} />}
      <select name="area" defaultValue={sp.area || ""} className="input !w-auto min-w-[14rem]" aria-label="Area"><option value="">{t("rs_all_areas")} ({areas.length})</option>{areas.map((a: any) => <option key={a.slug} value={a.slug}>{a.name}{a.pincode ? ` · ${a.pincode}` : ""}</option>)}</select>
      <button className="btn btn-dark !py-2 text-sm">{t("rs_show")}</button><Link href={link({ veg: sp.veg === "1" ? undefined : "1" })} className={chip(sp.veg === "1")}>{t("rs_veg")}</Link></form>
    {rs.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rs.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div> : (
      <div className="card mt-8 p-8 text-center"><h2 className="text-3xl">No restaurants here yet</h2><p className="mx-auto mt-2 max-w-md text-muted">We are onboarding kitchens across Ahmedabad. Tell us where you are and we will message you when the first ones go live.</p><div className="mx-auto mt-6 max-w-lg text-left"><WaitlistForm areas={areas} /></div><p className="mt-6 text-sm">Own a restaurant? <Link href="/partner/register" className="font-extrabold text-chilli">List it free for 90 days →</Link></p></div>)}</div>);
}
