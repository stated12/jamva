import Link from "next/link";
import { registerVendor } from "@/app/partner/actions";
import { listAreas, listCities, resolveCity } from "@/lib/data";
import { getVendorListing } from "@/lib/pricing";
import { currentUser } from "@/lib/supabase-server";
import CityPicker from "@/components/CityPicker";
import LeadForm from "@/components/LeadForm";
import GpsField from "@/components/GpsField";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Join as a street vendor", description: "List your cart or stall on Jamva in minutes. Zero commission, 90 days free, one-tap Open and Closed." };
export const dynamic = "force-dynamic";
const MSG: Record<string, string> = { invalid: "Please fill the starred fields. Password needs 8+ characters.", fssai: "Enter your 14-digit FSSAI number, or choose Applied / Need help.", exists: "This email already has an account. Sign in first, then come back.", create: "Could not create your account. Please try again.", save: "Could not save. Please try again.", rate: "Too many attempts. Please try later.", lead: "Please enter your name and a valid 10-digit mobile number." };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; city?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const [areas, cities, geo, user, v] = await Promise.all([listAreas(), listCities(), resolveCity(sp.city), currentUser(), getVendorListing()]);
  return (<div className="wrap max-w-2xl py-12"><p className="kicker">{t("v_kicker")}</p><h1 className="text-4xl">{t("v_title")}</h1><p className="mt-2 text-muted">{t("v_sub", { days: v.trial_days, monthly: v.monthly_fee, yearly: v.yearly_fee })}</p>
    {sp.e && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || MSG.invalid} {sp.e === "exists" && <Link href="/login?next=/street-vendors/join" className="underline">Sign in</Link>}</p>}
    <div className="mt-6"><CityPicker action="/street-vendors/join" current={geo.name} cities={cities} t={t} /></div>
    {!geo.live ? <LeadForm role="vendor" city={geo.name} t={t} /> :
    <form action={registerVendor} className="mt-6 space-y-6"><input type="hidden" name="city" value={geo.name} />
      <section className="card p-5"><h2 className="text-2xl">{t("v_cart")}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">{t("v_stall")} *</label><input name="name" required className="input" placeholder="Raju Pav Bhaji" /></div>
        <div><label className="label">{t("v_owner")} *</label><input name="owner_name" required className="input" /></div><div><label className="label">{t("f_mobile")} *</label><input name="phone" required inputMode="tel" className="input" placeholder={t("f_mobile_ph")} /></div>
        <div className="sm:col-span-2"><label className="label">{t("v_sells")}</label><input name="cuisines" className="input" placeholder="Pav bhaji, Dabeli, Chaat" /></div>
        <div><label className="label">{t("f_area")} *</label><select name="area" required className="input" defaultValue=""><option value="" disabled>{t("f_area_sel")}</option>{areas.map((a: any) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select></div><div><label className="label">{t("f_pin")}</label><input name="pincode" inputMode="numeric" maxLength={6} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">{t("f_landmark")} *</label><input name="landmark" required className="input" placeholder={t("v_landmark_ph")} /></div>
        <GpsField labels={{ pin: t("v_pin"), ok: t("v_pin_ok"), busy: t("v_pin_busy"), fail: t("v_pin_fail") }} />
        <div><label className="label">{t("v_fssai")}</label><select name="fssai_status" className="input" defaultValue="help"><option value="have">{t("o_have")}</option><option value="applied">{t("o_applied")}</option><option value="help">{t("o_help")}</option></select></div><div><label className="label">{t("v_fssai_no")}</label><input name="fssai_no" inputMode="numeric" maxLength={14} className="input" /></div>
        <div><label className="label">{t("f_logo")}</label><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></div><label className="flex items-center gap-2 pt-6 text-sm font-semibold"><input type="checkbox" name="veg_only" className="h-4 w-4" /> {t("f_veg")}</label></div></section>
      {!user ? <section className="card p-5"><h2 className="text-2xl">{t("f_login")}</h2><p className="text-sm text-muted">{t("v_login_note")}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label className="label">{t("f_email")} *</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">{t("f_password")} *</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div></div></section>
        : <p className="card p-4 text-sm font-semibold">Signed in as {user.email}. This stall will be linked to your account.</p>}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1 h-4 w-4" /> <span>I confirm the details are correct and agree to the <Link href="/restaurant-agreement" className="underline" target="_blank">Partner Agreement</Link>.</span></label>
      <button className="btn btn-primary w-full !py-4 text-lg">{t("v_submit")}</button></form>}
    <p className="mt-6 text-sm text-muted">Questions? Write to support@jamva.in. Own a restaurant instead? <Link href="/partner/register" className="font-extrabold text-chilli">List your restaurant</Link>.</p></div>);
}
