import type { City } from "@/lib/data";
import type { T } from "@/lib/i18n";
/** Searchable city box (type to filter; any city can be typed). Plain GET form so it works without JavaScript. */
export default function CityPicker({ action, current, cities, t }: { action: string; current: string; cities: City[]; t: T }) {
  return (<form action={action} method="get" className="card flex flex-wrap items-end gap-3 p-4"><div className="min-w-[12rem] flex-1"><label className="label" htmlFor="city-box">{t("city_label")}</label>
    <input id="city-box" name="city" list="jv-cities" defaultValue={current} placeholder={t("city_ph")} className="input" autoComplete="off" /><datalist id="jv-cities">{cities.map((c) => <option key={c.slug} value={c.name}>{c.status === "live" ? t("city_live_tag") : t("city_soon_tag")}</option>)}</datalist></div>
    <button className="btn btn-dark !py-3">{t("continue")}</button><p className="w-full text-xs text-muted">{t("city_hint")}</p></form>);
}
