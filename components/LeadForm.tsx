import { saveLead } from "@/app/actions";
import type { T } from "@/lib/i18n";
import LocalityFields from "./LocalityFields";
/** Short form for people in a city where Jamva is not live yet. Stored as a waitlist lead with city and PIN so demand can be ranked. */
export default function LeadForm({ role, city, t, areas = [] }: { role: "restaurant" | "vendor" | "driver"; city: string; t: T; areas?: { name: string; pincode?: string | null }[] }) {
  const biz = role !== "driver";
  return (<form action={saveLead} className="card mt-4 space-y-4 p-5"><input type="hidden" name="role" value={role} /><input type="hidden" name="city" value={city} />
    <p className="rounded-xl bg-leaf-soft p-3 text-sm font-semibold text-leaf">{t("waitlist_msg", { city })}</p>
    <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">{t("f_name")} *</label><input name="name" required className="input" autoComplete="name" /></div><div><label className="label">{t("f_mobile")} *</label><input name="phone" required inputMode="tel" className="input" autoComplete="tel" placeholder={t("f_mobile_ph")} /></div>
      <LocalityFields areas={areas} labels={{ locality: t("f_locality"), pin: t("f_pin") }} />
      {biz && <><div><label className="label">{role === "vendor" ? t("v_stall") : t("f_business")}</label><input name="business" className="input" /></div>
        <div><label className="label">{t("f_category")}</label><select name="category" className="input" defaultValue={role === "vendor" ? "Street Cart / Stall" : "Restaurant"}>{["Restaurant", "Cloud Kitchen", "Street Cart / Stall", "Cafe / Bakery"].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">{t("f_cuisine")}</label><input name="cuisine" className="input" placeholder="Gujarati, Chaat, Biryani" /></div>
        <div className="sm:col-span-2"><label className="label">{t("f_fssai_status")}</label><select name="fssai_status" className="input" defaultValue="have"><option value="have">{t("o_have")}</option><option value="applied">{t("o_applied")}</option><option value="help">{t("o_help")}</option></select></div></>}
      {!biz && <><div><label className="label">{t("r_vehicle")}</label><select name="vehicle" className="input"><option>Bike / Scooter</option><option>Electric Vehicle (EV)</option><option>Cycle</option></select></div>
        <div><label className="label">{t("r_licence")}</label><select name="licence_status" className="input"><option value="yes">{t("r_licence_yes")}</option><option value="learner">{t("r_licence_learner")}</option></select></div>
        <div className="sm:col-span-2"><label className="label">{t("r_shift")}</label><select name="shift" className="input"><option>Full-Time</option><option>Part-Time / Evening</option></select></div></>}</div>
    <button className="btn btn-primary w-full">{t("waitlist_btn", { city })}</button></form>);
}
