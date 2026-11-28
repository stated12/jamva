import { db } from "./db";
import { todayIST } from "./format";
import { SEED_AREAS, SEED_CITIES } from "./seed";
/** A restaurant is visible to customers when approved and inside its free trial or a paid listing year. */
export async function listRestaurants(opts: { area?: string; q?: string; veg?: boolean; limit?: number; kind?: "street" | "restaurant"; openOnly?: boolean } = {}) {
  const t = todayIST();
  let q = db().from("restaurants").select("id,slug,name,kind,landmark,lat,lng,tagline,cuisines,logo_url,cover_url,veg_only,prep_minutes,min_order_paise,is_open,area_id,areas:jm_areas(name,slug)").eq("status", "approved").or(`trial_until.gte.${t},listing_paid_until.gte.${t}`).order("is_open", { ascending: false }).order("name").limit(opts.limit || 60);
  if (opts.veg) q = q.eq("veg_only", true);
  if (opts.kind === "street") q = q.eq("kind", "street_vendor").eq("is_open", true);
  if (opts.kind === "restaurant") q = q.neq("kind", "street_vendor");
  if (opts.openOnly) q = q.eq("is_open", true);
  if (opts.q) q = q.ilike("name", `%${opts.q.replace(/[%,()]/g, "")}%`);
  const { data } = await q;
  let list: any[] = (data || []).filter((r: any) => r.kind !== "street_vendor" || r.is_open); // street carts only show while open
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
let healed = false;
/** Active areas, A to Z. If the database has fewer areas than the built-in Ahmedabad list (114 localities with pincodes), the missing ones are added once, so registration forms are always complete. */
export async function listAreas(city = "ahmedabad"): Promise<any[]> {
  const read = async () => {
    let r = await db().from("areas").select("*").eq("is_active", true).eq("city_slug", city).order("name");
    if (r.error) r = await db().from("areas").select("*").eq("is_active", true).order("name"); // city_slug column not added yet (run 07_cities_areas.sql): Ahmedabad list only
    if (r.error) console.error("[areas] read failed:", r.error.message);
    return r.data || [];
  };
  if (city !== "ahmedabad") { try { return await read(); } catch { return []; } }
  let rows: any[] = [];
  try { rows = await read(); } catch (e: any) { console.error("[areas]", e?.message || e); }
  if (rows.length < SEED_AREAS.length && !healed) {
    healed = true;
    try {
      const full = SEED_AREAS.map(([slug, name, lat, lng, pincode, approx], i) => ({ slug, name, lat, lng, pincode, coords_approx: !!approx, sort_order: i + 1 }));
      let { error } = await db().from("areas").upsert(full, { onConflict: "slug", ignoreDuplicates: true });
      if (error) ({ error } = await db().from("areas").upsert(full.map(({ pincode, coords_approx, ...r }) => r), { onConflict: "slug", ignoreDuplicates: true })); // pincode column not added yet (run 06_areas.sql)
      if (error) console.error("[areas] seed failed:", error.message);
      rows = await read();
    } catch (e: any) { console.error("[areas]", e?.message || e); }
  }
  // Last resort: built-in list, so a form can never show an empty dropdown.
  if (!rows.length) rows = SEED_AREAS.map(([slug, name, lat, lng, pincode], i) => ({ id: null, slug, name, lat, lng, pincode, sort_order: i + 1 })).sort((x, y) => x.name.localeCompare(y.name));
  return rows;
}
/** One area by slug: from the database, or the built-in list when the database has none (id is then null). */
export async function findArea(slug: string): Promise<{ id: string | null; slug: string; name: string; lat: number; lng: number; pincode?: string | null } | null> {
  try { const { data } = await db().from("areas").select("*").eq("slug", slug).maybeSingle(); if (data) return data; } catch { /* fall through */ }
  const s = SEED_AREAS.find((a) => a[0] === slug); return s ? { id: null, slug: s[0], name: s[1], lat: s[2], lng: s[3], pincode: s[4] } : null;
}
export type City = { slug: string; name: string; state: string | null; status: string };
export async function listCities(): Promise<City[]> {
  const read = async () => (await db().from("cities").select("slug,name,state,status").order("sort_order")).data || [];
  let rows: City[] = await read();
  if (!rows.length) {
    await db().from("cities").upsert(SEED_CITIES.map(([slug, name, state, live], i) => ({ slug, name, state, status: live ? "live" : "waitlist", sort_order: live ? 1 : 10 + i })), { onConflict: "slug" });
    rows = await read();
  }
  if (!rows.length) rows = SEED_CITIES.map(([slug, name, state, live]) => ({ slug, name, state, status: live ? "live" : "waitlist" })); // table not created yet: Ahmedabad stays live
  return rows;
}
/** Works out which city a person chose (free text from a searchable list) and whether Jamva is live there. */
export async function resolveCity(input: string | null | undefined): Promise<{ name: string; slug: string; live: boolean; known: boolean }> {
  const raw = (input || "").trim().slice(0, 60) || "Ahmedabad";
  const cities = await listCities();
  const hit = cities.find((c) => c.name.toLowerCase() === raw.toLowerCase() || c.slug === raw.toLowerCase());
  return hit ? { name: hit.name, slug: hit.slug, live: hit.status === "live", known: true } : { name: raw, slug: "", live: false, known: false };
}
