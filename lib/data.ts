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
/** Active areas. If the table is empty (seed SQL not run yet) the built-in Ahmedabad areas are saved first, so registration forms always work. */
export async function listAreas(): Promise<any[]> {
  const read = async () => (await db().from("areas").select("*").eq("is_active", true).order("sort_order")).data || [];
  let rows: any[] = await read();
  if (!rows.length) {
    await db().from("areas").upsert(SEED_AREAS.map(([slug, name, lat, lng], i) => ({ slug, name, lat, lng, sort_order: i + 1 })), { onConflict: "slug" });
    rows = await read();
  }
  return rows;
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
export async function resolveCity(input: string | null | undefined): Promise<{ name: string; live: boolean; known: boolean }> {
  const raw = (input || "").trim().slice(0, 60) || "Ahmedabad";
  const cities = await listCities();
  const hit = cities.find((c) => c.name.toLowerCase() === raw.toLowerCase() || c.slug === raw.toLowerCase());
  return hit ? { name: hit.name, live: hit.status === "live", known: true } : { name: raw, live: false, known: false };
}
