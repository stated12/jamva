import { db } from "./db";
import { km } from "./format";
export type Fees = { tiers: { upto_km: number; fee: number }[]; max_km: number; gst_percent: number; small_order_below: number; cod_enabled: boolean; online_enabled: boolean };
export type Listing = { yearly_fee: number; gst_percent: number; trial_days: number };
const DEF_FEES: Fees = { tiers: [{ upto_km: 2, fee: 25 }, { upto_km: 4, fee: 35 }, { upto_km: 6, fee: 45 }, { upto_km: 8, fee: 60 }], max_km: 8, gst_percent: 18, small_order_below: 0, cod_enabled: true, online_enabled: true };
const DEF_LISTING: Listing = { yearly_fee: 6000, gst_percent: 18, trial_days: 90 };
export async function setting<T>(key: string, def: T): Promise<T> {
  try { const { data } = await db().from("settings").select("value").eq("key", key).maybeSingle(); return data?.value ? { ...def, ...data.value } : def; } catch { return def; }
}
export type VendorListing = { monthly_fee: number; yearly_fee: number; gst_percent: number; trial_days: number };
export const getVendorListing = () => setting<VendorListing>("vendor_listing", { monthly_fee: 199, yearly_fee: 1499, gst_percent: 18, trial_days: 90 });
export const getFees = () => setting<Fees>("fees", DEF_FEES);
export const getListing = () => setting<Listing>("listing", DEF_LISTING);
/** Straight-line distance x1.3 as a road estimate. Delivery fee tiers come from settings; null = out of range. */
export function quote(fees: Fees, from: { lat: number; lng: number }, to: { lat: number; lng: number }, subtotalPaise: number) {
  const dist = Math.round(km(from.lat, from.lng, to.lat, to.lng) * 1.3 * 10) / 10;
  if (dist > fees.max_km) return { ok: false as const, distance: dist };
  const tier = fees.tiers.find((t) => dist <= t.upto_km) || fees.tiers[fees.tiers.length - 1];
  const delivery = Math.round(tier.fee * 100);
  const gst = Math.round((delivery * fees.gst_percent) / 100);
  return { ok: true as const, distance: dist, deliveryPaise: delivery, gstPaise: gst, totalPaise: subtotalPaise + delivery + gst, eta: Math.round(20 + dist * 4) };
}
