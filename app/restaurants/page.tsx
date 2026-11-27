import Link from "next/link";
import { listRestaurants, listAreas } from "@/lib/data";
import RestaurantCard from "@/components/RestaurantCard";
import WaitlistForm from "@/components/WaitlistForm";
export const metadata = { title: "Restaurants in Ahmedabad", description: "Order from Ahmedabad restaurants with zero commission menu prices and one honest delivery fee." };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ area?: string; q?: string; veg?: string }> }) {
  const sp = await searchParams; const [areas, rs] = await Promise.all([listAreas().catch(() => []), listRestaurants({ area: sp.area, q: sp.q, veg: sp.veg === "1", limit: 60 }).catch(() => [])]);
  const chip = (on: boolean) => `chip whitespace-nowrap !px-4 !py-2 text-sm ${on ? "!bg-ink text-white" : "border border-line bg-white"}`;
  const link = (o: Record<string, string | undefined>) => { const p = new URLSearchParams(); const m = { ...sp, ...o }; Object.entries(m).forEach(([k, v]) => v && p.set(k, v)); const s = p.toString(); return "/restaurants" + (s ? "?" + s : ""); };
  return (<div className="wrap py-10"><h1 className="text-4xl md:text-5xl">Restaurants in Ahmedabad</h1><p className="mt-2 text-muted">Same price as the menu. One delivery fee. Zero platform fee.</p>
    <form className="mt-6 flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Search restaurants" className="input" />{sp.area && <input type="hidden" name="area" value={sp.area} />}<button className="btn btn-dark">Search</button></form>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-2"><Link href={link({ area: undefined })} className={chip(!sp.area)}>All areas</Link>{areas.map((a: any) => <Link key={a.slug} href={link({ area: a.slug })} className={chip(sp.area === a.slug)}>{a.name}</Link>)}<Link href={link({ veg: sp.veg === "1" ? undefined : "1" })} className={chip(sp.veg === "1")}>Pure veg</Link></div>
    {rs.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rs.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div> : (
      <div className="card mt-8 p-8 text-center"><h2 className="text-3xl">No restaurants here yet</h2><p className="mx-auto mt-2 max-w-md text-muted">We are onboarding kitchens across Ahmedabad. Tell us where you are and we will message you when the first ones go live.</p><div className="mx-auto mt-6 max-w-lg text-left"><WaitlistForm areas={areas} /></div><p className="mt-6 text-sm">Own a restaurant? <Link href="/partner/register" className="font-extrabold text-chilli">List it free for 90 days →</Link></p></div>)}</div>);
}
