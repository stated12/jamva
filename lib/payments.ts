import { db } from "./db";
import { createRzpOrder, fetchRzpPayment, fetchRzpOrderPayments, captureRzpPayment } from "./razorpay";
import { markOrderPaid } from "./orders";
import { getListing, getVendorListing } from "./pricing";
import { notify, notifyAdmins } from "./notify";
import { razorpayConfigured, razorpayKeyId } from "./env";
import { todayIST } from "./format";
const paise2r = (p: number) => p / 100;
export async function createOrderPayment(order: any, userId: string) {
  if (!razorpayConfigured()) return { ok: false as const, error: "unavailable" };
  const rz = await createRzpOrder(paise2r(order.total_paise), order.code, { purpose: "order", order: order.code });
  const ins = await db().from("payments").insert({ purpose: "order", order_id: order.id, user_id: userId, amount_paise: order.total_paise, razorpay_order_id: rz.id });
  if (ins.error) { console.error("[pay] could not record payment:", ins.error.message); return { ok: false as const, error: "unavailable" }; }
  await db().from("orders").update({ razorpay_order_id: rz.id }).eq("id", order.id);
  return { ok: true as const, razorpayOrderId: rz.id, amountPaise: order.total_paise, keyId: razorpayKeyId() };
}
export async function createListingPayment(restaurant: any, userId: string, planIn?: string) {
  if (!razorpayConfigured()) return { ok: false as const, error: "unavailable" };
  const vendor = restaurant.kind === "street_vendor"; const plan = vendor && planIn === "monthly" ? "monthly" : "yearly";
  const l: { yearly_fee: number; monthly_fee?: number; gst_percent: number } = vendor ? await getVendorListing() : await getListing();
  const fee = plan === "monthly" ? (l.monthly_fee || 0) : l.yearly_fee; const base = Math.round(fee * 100), gst = Math.round((base * l.gst_percent) / 100), total = base + gst;
  const rz = await createRzpOrder(paise2r(total), "LST-" + restaurant.slug, { purpose: "listing", restaurant: restaurant.slug });
  await db().from("payments").insert({ purpose: "listing", restaurant_id: restaurant.id, user_id: userId, amount_paise: total, gst_paise: gst, plan, razorpay_order_id: rz.id });
  return { ok: true as const, razorpayOrderId: rz.id, amountPaise: total, keyId: razorpayKeyId() };
}
/** Idempotent settlement for both orders and listing fees. Called by the checkout callback, the webhook and the reconcile job.
 *  Safe to call many times and in any order: money is only ever counted once, and an order that missed its "paid" step is completed on a retry. */
export async function settlePayment(razorpayOrderId: string, paymentId: string, method?: string, raw?: any) {
  const { data: p } = await db().from("payments").select("*").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (!p) return;
  if (raw?.amount !== undefined && Number(raw.amount) !== p.amount_paise) { // never mark paid when Razorpay says a different amount was paid
    console.error("[pay] amount mismatch", razorpayOrderId, raw.amount, p.amount_paise); await notifyAdmins({ title: "Payment amount mismatch", body: `Razorpay order ${razorpayOrderId}: paid ${raw.amount}, expected ${p.amount_paise}. Check it in Razorpay.`, href: "/admin/orders" }); return;
  }
  if (p.status === "paid") { if (p.purpose === "order" && p.order_id) await markOrderPaid(p.order_id, p.razorpay_payment_id || paymentId); return; } // earlier attempt may have stopped half way: finish the order step (it does nothing if already done)
  // "failed" is allowed too: Razorpay lets a customer retry on the same order after a failed attempt.
  const { data: upd } = await db().from("payments").update({ status: "paid", razorpay_payment_id: paymentId, method: method || null, raw: raw || null, paid_at: new Date().toISOString() }).eq("id", p.id).in("status", ["created", "failed"]).select("id");
  if (!upd?.length) return;
  if (p.purpose === "order" && p.order_id) await markOrderPaid(p.order_id, paymentId);
  if (p.purpose === "listing" && p.restaurant_id) {
    const { data: r } = await db().from("restaurants").select("name,owner_id,listing_paid_until,trial_until").eq("id", p.restaurant_id).maybeSingle();
    const t = todayIST(); const from = [r?.listing_paid_until, r?.trial_until, t].filter(Boolean).sort().pop() as string;
    const d = new Date(from + "T00:00:00Z"); if (p.plan === "monthly") d.setUTCMonth(d.getUTCMonth() + 1); else d.setUTCFullYear(d.getUTCFullYear() + 1);
    await db().from("restaurants").update({ listing_paid_until: d.toISOString().slice(0, 10) }).eq("id", p.restaurant_id);
    await notify(r?.owner_id, { title: p.plan === "monthly" ? "Monthly listing activated" : "Yearly listing activated", body: `Thank you. ${r?.name} is listed until ${d.toISOString().slice(0, 10)}.`, href: "/partner/dashboard" });
    await notifyAdmins({ title: "Listing fee received", body: `${r?.name} paid the listing fee (${p.plan || "yearly"}).`, href: "/admin/restaurants" });
  }
}
/** Ask Razorpay directly about a payment (customer came back before the webhook, or the webhook was missed). Captures an authorized payment first. */
export async function settleFromRazorpay(razorpayOrderId: string, paymentId: string) {
  let pay = await fetchRzpPayment(paymentId);
  if (pay?.order_id !== razorpayOrderId) return;
  if (pay.status === "authorized") pay = await captureRzpPayment(paymentId, pay.amount).catch(async () => fetchRzpPayment(paymentId)); // account set to manual capture: capture it now
  if (pay?.status === "captured") await settlePayment(razorpayOrderId, paymentId, pay.method, pay);
}
/** Safety net for lost webhooks: looks at payments still "created"/"failed" for the last 3 days and settles any that Razorpay says were paid. Returns how many were fixed. */
export async function reconcilePayments(): Promise<{ checked: number; settled: number }> {
  const since = new Date(Date.now() - 3 * 864e5).toISOString(), before = new Date(Date.now() - 2 * 60e3).toISOString();
  const { data: pend } = await db().from("payments").select("razorpay_order_id,status").in("status", ["created", "failed"]).gte("created_at", since).lte("created_at", before).limit(50);
  let settled = 0;
  for (const p of pend || []) {
    try {
      const r = await fetchRzpOrderPayments(p.razorpay_order_id); const ok = (r?.items || []).find((x: any) => x.status === "captured" || x.status === "authorized");
      if (ok) { await settleFromRazorpay(p.razorpay_order_id, ok.id); settled++; }
    } catch (e: any) { console.error("[reconcile]", p.razorpay_order_id, e?.message); }
  }
  return { checked: (pend || []).length, settled };
}
