import type { MetadataRoute } from "next"; import { SITE_URL } from "@/lib/env"; import { listRestaurants } from "@/lib/data";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = ["", "/restaurants", "/partner", "/drivers", "/driver/register", "/about", "/faq", "/contact", "/terms", "/privacy", "/refunds", "/delivery-policy", "/restaurant-agreement"].map((p) => ({ url: SITE_URL + p, lastModified: new Date() }));
  let rs: any[] = []; try { rs = await listRestaurants({ limit: 500 }); } catch { /* db not ready */ }
  return [...base, ...rs.map((r) => ({ url: `${SITE_URL}/r/${r.slug}`, lastModified: new Date() }))];
}
