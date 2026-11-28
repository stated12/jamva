import Link from "next/link";
import { registerRestaurant } from "../actions";
import { listAreas, listCities, resolveCity } from "@/lib/data";
import CityPicker from "@/components/CityPicker";
import { getT } from "@/lib/i18n";
import LeadForm from "@/components/LeadForm";
import { currentUser } from "@/lib/supabase-server";
import { getListing } from "@/lib/pricing";
export const metadata = { title: "Join as a restaurant" };
export const dynamic = "force-dynamic";
const MSG: Record<string, string> = { invalid: "Please check all required fields. Password needs 8+ characters.", fssai: "Enter your 14-digit FSSAI licence number.", exists: "This email already has an account. Sign in first, then come back to this page.", create: "Could not create your account. Please try again.", save: "Could not save your application. Please try again.", rate: "Too many attempts. Please try later.", lead: "Please enter your name and a valid 10-digit mobile number." };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; city?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const [areas, user, l, cities, geo] = await Promise.all([listAreas(), currentUser(), getListing(), listCities(), resolveCity(sp.city)]);
  return (<div className="wrap max-w-2xl py-12"><p className="kicker">Restaurant application</p><h1 className="text-4xl">List your restaurant on Jamva</h1><p className="mt-2 text-muted">Free for {l.trial_days} days, zero commission. We verify every restaurant before it goes live.</p>
    {sp.e && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || MSG.invalid} {sp.e === "exists" && <Link href="/login?next=/partner/register" className="underline">Sign in</Link>}</p>}
    <div className="mt-6"><CityPicker action="/partner/register" current={geo.name} cities={cities} t={t} /></div>
    {!geo.live ? <LeadForm role="restaurant" city={geo.name} t={t} /> :
    <form action={registerRestaurant} className="mt-6 space-y-6"><input type="hidden" name="city" value={geo.name} />
      {!user ? <section className="card p-5"><h2 className="text-2xl">Your login</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label className="label">Owner name *</label><input name="owner_name" required className="input" /></div><div><label className="label">Email *</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div className="sm:col-span-2"><label className="label">Password (8+ characters) *</label><input name="password" type="password" minLength={8} required className="input" autoComplete="new-password" /></div></div><p className="mt-3 text-xs text-muted">Already registered? <Link href="/login?next=/partner/register" className="underline">Sign in</Link> first.</p></section>
        : <p className="card p-4 text-sm font-semibold">Signed in as {user.email}. This restaurant will be linked to your account.</p>}
      <section className="card p-5"><h2 className="text-2xl">Restaurant</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Restaurant name *</label><input name="name" required className="input" /></div>
        <div><label className="label">Category *</label><select name="category" className="input" defaultValue="Restaurant">{["Restaurant", "Cloud Kitchen", "Cafe / Bakery"].map((c) => <option key={c}>{c}</option>)}</select></div><div><label className="label">PIN code</label><input name="pincode" inputMode="numeric" maxLength={6} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">One-line description</label><input name="tagline" maxLength={100} className="input" placeholder="Authentic Gujarati thali since 1998" /></div>
        <div className="sm:col-span-2"><label className="label">Cuisines (comma separated)</label><input name="cuisines" className="input" placeholder="Gujarati, North Indian, Street food" /></div>
        <div className="sm:col-span-2"><label className="label">Full address *</label><input name="address" required className="input" /></div>
        <div><label className="label">Area *</label><select name="area" required className="input" defaultValue=""><option value="" disabled>Select area</option>{areas.map((a: any) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select></div>
        <div><label className="label">Restaurant phone *</label><input name="phone" required inputMode="tel" className="input" /></div>
        <div><label className="label">WhatsApp for orders (if different)</label><input name="whatsapp" inputMode="tel" className="input" /></div>
        <div><label className="label">Contact email</label><input name="contact_email" type="email" className="input" /></div>
        <div><label className="label">FSSAI licence number (14 digits) *</label><input name="fssai_no" required inputMode="numeric" maxLength={14} className="input" /></div>
        <div><label className="label">GSTIN (optional)</label><input name="gstin" maxLength={15} className="input" /></div>
        <div><label className="label">Logo (JPG/PNG, max 3 MB)</label><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></div>
        <div><label className="label">Cover photo (max 3 MB)</label><input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></div>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="veg_only" className="h-4 w-4" /> Pure vegetarian kitchen</label></div></section>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1 h-4 w-4" /> <span>I confirm the details are correct and I agree to the <Link href="/restaurant-agreement" className="underline" target="_blank">Restaurant Agreement</Link>.</span></label>
      <button className="btn btn-primary w-full !py-4 text-lg">{t("f_submit")}</button></form>}
    <p className="mt-6 text-sm text-muted">Selling from a cart or stall? <Link href="/street-vendors/join" className="font-extrabold text-chilli">Join as a street vendor</Link>. Need help? support@jamva.in</p></div>);
}
