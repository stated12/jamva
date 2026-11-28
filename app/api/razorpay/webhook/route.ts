import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { settlePayment, settleFromRazorpay } from "@/lib/payments";
import { notifyAdmins } from "@/lib/notify";
export const dynamic = "force-dynamic";
/** Razorpay -> Jamva. Events to enable: payment.authorized, payment.captured, payment.failed, order.paid, refund.processed, refund.failed.
 *  Every request is signature-checked on the raw body; each event id is processed once; a failure returns 500 so Razorpay retries. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || "")) return NextResponse.json({ ok: false }, { status: 400 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const pay = ev.payload?.payment?.entity, refund = ev.payload?.refund?.entity;
  const eventId = req.headers.get("x-razorpay-event-id") || `${ev.event}:${refund?.id || pay?.id || ev.created_at}`;
  const ins = await db().from("webhook_events").insert({ event_id: eventId, event_type: String(ev.event), payload: ev });
  if (ins.error) {
    if (ins.error.code === "23505") return NextResponse.json({ ok: true, duplicate: true }); // already received: acknowledge without doing it twice
    console.error("[webhook] could not record event:", ins.error.message); return NextResponse.json({ ok: false }, { status: 500 }); // real database problem: ask Razorpay to retry
  }
  let error: string | null = null;
  try {
    if (pay?.order_id && (ev.event === "payment.captured" || ev.event === "order.paid")) await settlePayment(pay.order_id, pay.id, pay.method, pay);
    else if (pay?.order_id && ev.event === "payment.authorized") await settleFromRazorpay(pay.order_id, pay.id); // captures it, then settles
    else if (pay?.order_id && ev.event === "payment.failed") await db().from("payments").update({ status: "failed" }).eq("razorpay_order_id", pay.order_id).eq("status", "created");
    else if (refund?.payment_id && ev.event === "refund.processed") {
      await db().from("orders").update({ payment_status: "refunded" }).eq("razorpay_payment_id", refund.payment_id).in("payment_status", ["paid", "refund_due"]);
      await db().from("payments").update({ status: "refunded" }).eq("razorpay_payment_id", refund.payment_id);
    } else if (refund?.payment_id && ev.event === "refund.failed") {
      await db().from("orders").update({ payment_status: "refund_due" }).eq("razorpay_payment_id", refund.payment_id).eq("payment_status", "refunded");
      await notifyAdmins({ title: "Refund failed at Razorpay", body: `Payment ${refund.payment_id} refund ${refund.id} failed. Check it in the Razorpay dashboard.`, href: "/admin/orders" });
    }
  } catch (e: any) { error = String(e?.message || e).slice(0, 300); console.error("[webhook]", ev.event, error); }
  if (error) await db().from("webhook_events").delete().eq("event_id", eventId); else await db().from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("event_id", eventId);
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
