import Link from "next/link";
import { getT } from "@/lib/i18n";
import { listCities } from "@/lib/data";
export const metadata = { title: "Join Jamva", description: "Join Jamva as a restaurant, street vendor or delivery partner." };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const cities = await listCities().catch(() => []);
  const q = sp.city ? "?city=" + encodeURIComponent(sp.city) : "";
  const roles: [string, string, string, string][] = [["/partner/register", t("role_restaurant"), t("role_restaurant_d"), t("cta_restaurant")], ["/street-vendors/join", t("role_vendor"), t("role_vendor_d"), t("cta_vendor")], ["/driver/register", t("role_rider"), t("role_rider_d"), t("cta_rider")]];
  return (<div className="wrap max-w-3xl py-14"><p className="kicker">{t("join_kicker")}</p><h1 className="text-4xl md:text-5xl">{t("join_title")}</h1><p className="mt-2 text-muted">{t("join_sub")}</p>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{roles.map(([h, title, d, c]) => <Link key={h} href={h + q} className="card block p-5 transition hover:-translate-y-1 hover:shadow-xl"><h2 className="text-2xl">{title}</h2><p className="mt-2 text-sm text-muted">{d}</p><span className="btn btn-primary mt-4 !py-2 text-sm">{c}</span></Link>)}</div>
    <h2 className="mt-12 text-2xl">{t("cities_title")}</h2><p className="mt-3 text-sm font-bold text-leaf">{t("cities_live")}</p><div className="mt-2 flex flex-wrap gap-2">{cities.filter((c) => c.status === "live").map((c) => <Link key={c.slug} href={`/join?city=${encodeURIComponent(c.name)}`} className="chip !bg-leaf-soft !text-leaf !px-4 !py-2 text-sm">{c.name}</Link>)}</div>
    <p className="mt-4 text-sm font-bold text-muted">{t("cities_soon")}</p><div className="mt-2 flex flex-wrap gap-2">{cities.filter((c) => c.status !== "live").map((c) => <Link key={c.slug} href={`/join?city=${encodeURIComponent(c.name)}`} className="chip !px-4 !py-2 text-sm">{c.name}</Link>)}</div></div>);
}
