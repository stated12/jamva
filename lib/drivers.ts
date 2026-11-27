import { redirect } from "next/navigation";
import { db } from "./db";
import { notify } from "./notify";
import { rupees } from "./format";
import { setting } from "./pricing";
import { currentUser } from "./supabase-server";
import { requireUser } from "./session";

export type DriverCfg = { pay_percent: number; min_pay: number; max_active: number };
export const getDriverCfg = () => setting<DriverCfg>("driver", { pay_percent: 100, min_pay: 20, max_active: 2 });
/** Rider pay for one order in paise: a share of the delivery fee (before GST), never below the minimum. */
export function riderPay(deliveryFeePaise: number, cfg: DriverCfg): number {
  return Math.max(Math.round((cfg.min_pay || 0) * 100), Math.round((deliveryFeePaise * (cfg.pay_percent || 0)) / 100));
}
export const ACTIVE_STATUSES = ["accepted", "preparing", "ready", "picked_up"];

export async function myDriver() {
  const u = await currentUser(); if (!u) return null;
  const { data } = await db().from("drivers").select("*").eq("user_id", u.id).maybeSingle();
  return data || null;
}
/** Signed-in rider with a driver record (any status). Sends everyone else to sign in or to the rider sign-up. */
export async function requireDriver() {
  const p = await requireUser("/driver"); const d = await myDriver();
  if (!d) redirect("/driver/register");
  return { p, d };
}
/** Tell online, approved riders that a delivery can be taken. Skipped quietly if there are none. */
export async function announceToDrivers(o: { id: string; code: string; delivery_fee_paise: number; restaurants?: { name?: string } | null; address?: { area?: string } | null }) {
  try {
    const cfg = await getDriverCfg();
    const { data: ds } = await db().from("drivers").select("user_id").eq("status", "active").eq("is_online", true).limit(60);
    const pay = rupees(riderPay(o.delivery_fee_paise, cfg));
    await Promise.allSettled((ds || []).filter((d: any) => d.user_id).map((d: any) => notify(d.user_id, { title: `New delivery ${o.code}: earn ${pay}`, body: `${o.restaurants?.name || "Restaurant"} to ${o.address?.area || "customer"}. Tap to take it.`, href: "/driver" })));
  } catch { /* never block an order */ }
}
/** Earnings and cash position for one rider (all amounts in paise). */
export async function driverBalance(driverId: string) {
  const [{ data: done }, { data: led }] = await Promise.all([
    db().from("orders").select("driver_pay_paise,total_paise,payment_method,payment_status").eq("driver_id", driverId).eq("status", "delivered"),
    db().from("driver_ledger").select("kind,amount_paise").eq("driver_id", driverId),
  ]);
  const earned = (done || []).reduce((s: number, o: any) => s + (o.driver_pay_paise || 0), 0);
  const cash = (done || []).filter((o: any) => o.payment_method === "cod").reduce((s: number, o: any) => s + (o.total_paise || 0), 0);
  const paid = (led || []).filter((l: any) => l.kind === "payout").reduce((s: number, l: any) => s + l.amount_paise, 0);
  const deposited = (led || []).filter((l: any) => l.kind === "cash_deposit").reduce((s: number, l: any) => s + l.amount_paise, 0);
  return { deliveries: (done || []).length, earned, paid, payable: earned - paid, cash, deposited, cashHeld: cash - deposited };
}
