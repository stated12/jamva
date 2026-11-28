import Link from "next/link";
import Image from "next/image";
import { listRestaurants, listAreas } from "@/lib/data";
import { getFees } from "@/lib/pricing";
import RestaurantCard from "@/components/RestaurantCard";
import BillExample from "@/components/BillExample";
import WaitlistForm from "@/components/WaitlistForm";
import { VENTURES } from "@/components/Footer";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const sp = await searchParams; const { t: tr } = await getT();
  const [rs, areas, fees] = await Promise.all([listRestaurants({ limit: 6 }).catch(() => []), listAreas().catch(() => []), getFees()]);
  const lowest = Math.min(...fees.tiers.map((t) => t.fee));
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF1D6] via-[#FFE3B8] to-[#FFD29A]">
      <div className="wrap grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div className="rise"><p className="kicker">{tr("h_kicker")}</p>
          <h1 className="mt-3 text-5xl md:text-7xl">{tr("h_title1")}<br /><span className="text-[#7A1D11]">{tr("h_title2")}</span></h1>
          <p className="mt-5 max-w-lg text-lg text-[#4a3d33]">{tr("h_lead", { fee: lowest })}</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/restaurants" className="btn btn-primary">{tr("h_browse")}</Link><Link href="/partner" className="btn btn-line">{tr("ft_list")}</Link></div>
          <p className="mt-5 text-sm font-semibold text-[#6d5a48]">{tr("h_pay")}</p></div>
        <div className="relative rise mx-auto w-full max-w-sm"><div className="overflow-hidden rounded-[2rem] shadow-2xl"><Image src="/brand/app-phone.jpg" alt="The Jamva app: order food, restaurants near you, track your order" width={542} height={898} priority className="h-auto w-full" /></div>
          <div className="absolute -bottom-4 -left-4 rotate-[-3deg] rounded-2xl bg-white px-4 py-3 shadow-xl"><p className="text-xs font-bold text-muted">{tr("h_pf")}</p><p className="font-display text-2xl text-leaf">₹0</p></div>
          <div className="absolute -right-3 top-8 rotate-[4deg] rounded-2xl bg-[#7A1D11] px-4 py-3 text-white shadow-xl"><p className="text-xs font-bold text-white/70">{tr("h_rc")}</p><p className="font-display text-2xl">0%</p></div></div></div></section>

    <section className="wrap py-14"><div className="grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker">{tr("h_why_k")}</p><h2 className="mt-2 text-4xl">{tr("h_why_t")}</h2>
      <p className="mt-4 text-[#4a3d33]">{tr("h_why_p")}</p>
      <ul className="mt-5 space-y-2 font-semibold"><li>✓ {tr("h_b1")}</li><li>✓ {tr("h_b2")}</li><li>✓ {tr("h_b3")}</li></ul></div><BillExample fee={3500} gstPct={fees.gst_percent} /></div></section>

    <section className="bg-soft py-14"><div className="wrap"><div className="flex items-end justify-between"><h2 className="text-4xl">{rs.length ? tr("h_open") : tr("h_joining")}</h2>{rs.length > 0 && <Link href="/restaurants" className="text-sm font-extrabold hover:text-chilli">{tr("see_all")}</Link>}</div>
      {rs.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rs.map((r) => <RestaurantCard key={r.id} r={r} />)}</div> : (
        <div id="waitlist" className="card mt-6 grid gap-8 p-6 md:grid-cols-2 md:p-10"><div><p className="kicker">{tr("h_fa_k")}</p><h3 className="mt-2 text-3xl">{tr("h_fa_t")}</h3><p className="mt-3 text-muted">{tr("h_fa_p")}</p>
          {sp.w === "ok" && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-bold text-leaf">{tr("h_ok")}</p>}{sp.w === "bad" && <p className="mt-4 text-chilli">{tr("h_bad")}</p>}{sp.w === "rate" && <p className="mt-4 text-chilli">{tr("h_rate")}</p>}</div>
          <WaitlistForm areas={areas} /></div>)}</div></section>

    <section className="wrap py-14"><div className="grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker">{tr("h_sv_k")}</p><h2 className="mt-2 text-4xl">{tr("h_sv_t")}</h2><p className="mt-4 text-[#4a3d33]">{tr("h_sv_p")}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/street-vendors" className="btn btn-primary">{tr("h_sv_see")}</Link><Link href="/street-vendors/join" className="btn btn-line">{tr("h_sv_join")}</Link></div></div>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">{[["/partner/register", tr("ft_list"), tr("h_c1")], ["/street-vendors/join", tr("h_sv_join"), tr("h_c2")], ["/driver/register", tr("h_ride"), tr("h_c3")]].map(([h, t, d]) => <Link key={h} href={h} className="card block p-4 transition hover:-translate-y-1 hover:shadow-xl"><p className="font-extrabold">{t}</p><p className="text-sm text-muted">{d}</p></Link>)}</div></div></section>

    <section className="wrap py-14"><p className="kicker">{tr("h_how_k")}</p><h2 className="mt-2 text-4xl">{tr("h_how_t")}</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{[["1", tr("h_s1t"), tr("h_s1d")], ["2", tr("h_s2t"), tr("h_s2d")], ["3", tr("h_s3t"), tr("h_s3d")]].map(([n, t, d]) => (<div key={n} className="card p-6"><span className="font-display text-5xl text-kesar">{n}</span><h3 className="mt-2 text-2xl">{t}</h3><p className="mt-2 text-muted">{d}</p></div>))}</div></section>

    <section className="bg-ink py-14 text-white"><div className="wrap grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker !text-kesar">{tr("h_ow_k")}</p><h2 className="mt-2 text-4xl">{tr("h_ow_t")}</h2>
      <p className="mt-4 text-white/75">{tr("h_ow_p")}</p><div className="mt-6 flex gap-3"><Link href="/partner" className="btn btn-primary">{tr("h_see_pr")}</Link><Link href="/partner/register" className="btn border-white text-white hover:bg-white hover:text-ink">{tr("h_join_free")}</Link></div></div>
      <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">0%</p><p className="text-sm text-white/70">{tr("h_commission")}</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">1</p><p className="text-sm text-white/70">{tr("h_yearly")}</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">90</p><p className="text-sm text-white/70">{tr("h_days")}</p></div></div></div></section>

    <section className="wrap py-14"><div className="card grid gap-8 p-6 md:grid-cols-3 md:p-10"><div className="md:col-span-1"><Image src="/founder/avdhesh-kumbhar.jpg" alt="Avdhesh Kumbhar, founder of Jamva" width={400} height={500} className="aspect-[4/5] w-full rounded-2xl object-cover" /></div>
      <div className="md:col-span-2"><p className="kicker">{tr("h_fd")}</p><h2 className="mt-2 text-4xl">Avdhesh Kumbhar</h2><p className="mt-1 font-semibold text-muted">Founder, ORIVANA Global Foundation</p>
        <p className="mt-4 text-[#4a3d33]">{tr("h_fd_p")}</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">{VENTURES.map((v) => (<li key={v.name}><a href={v.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line p-3 hover:border-kesar"><b>{v.name}</b><br /><span className="text-xs text-muted">{v.line}</span></a></li>))}</ul><Link href="/about" className="mt-5 inline-block text-sm font-extrabold text-chilli">{tr("h_full")}</Link></div></div></section>
  </>);
}
