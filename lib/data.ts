import { db } from "./db";
import { todayIST } from "./format";
/** A restaurant is visible to customers when approved and inside its free trial or a paid listing year. */
export async function listRestaurants(opts: { area?: string; q?: string; veg?: boolean; limit?: number } = {}) {
  const t = todayIST();
  let q = db().from("restaurants").select("id,slug,name,tagline,cuisines,logo_url,cover_url,veg_only,prep_minutes,min_order_paise,is_open,area_id,areas:jm_areas(name,slug)").eq("status", "approved").or(`trial_until.gte.${t},listing_paid_until.gte.${t}`).order("is_open", { ascending: false }).order("name").limit(opts.limit || 60);
  if (opts.veg) q = q.eq("veg_only", true);
  if (opts.q) q = q.ilike("name", `%${opts.q.replace(/[%,()]/g, "")}%`);
  const { data } = await q;
  let list: any[] = data || [];
  if (opts.area) list = list.filter((r) => r.areas?.slug === opts.area);
  return list;
}
export async function getRestaurant(slug: string) {
  const t = todayIST();
  const { data: r } = await db().from("restaurants").select("*, areas:jm_areas(name,slug,lat,lng)").eq("slug", slug).eq("status", "approved").or(`trial_until.gte.${t},listing_paid_until.gte.${t}`).maybeSingle();
  if (!r) return null;
  const [{ data: cats }, { data: items }] = await Promise.all([
    db().from("menu_categories").select("*").eq("restaurant_id", r.id).order("sort_order").order("name"),
    db().from("menu_items").select("*").eq("restaurant_id", r.id).order("sort_order").order("name"),
  ]);
  return { r, cats: cats || [], items: items || [] };
}
export async function listAreas() { const { data } = await db().from("areas").select("*").eq("is_active", true).order("sort_order"); return data || []; }
