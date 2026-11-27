import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { settlePayment } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || "")) return NextResponse.json({ ok: false }, { status: 400 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const eventId = req.headers.get("x-razorpay-event-id") || `${ev.event}:${ev.payload?.payment?.entity?.id || ev.created_at}`;
  const ins = await db().from("webhook_events").insert({ event_id: eventId, event_type: String(ev.event), payload: ev });
  if (ins.error) return NextResponse.json({ ok: true, duplicate: true });
  let error: string | null = null;
  try {
    const pay = ev.payload?.payment?.entity;
    if (pay?.order_id) {
      if (ev.event === "payment.captured" || ev.event === "order.paid") await settlePayment(pay.order_id, pay.id, pay.method, pay);
      else if (ev.event === "payment.failed") await db().from("payments").update({ status: "failed" }).eq("razorpay_order_id", pay.order_id).eq("status", "created");
    }
  } catch (e: any) { error = String(e?.message || e).slice(0, 300); }
  if (error) await db().from("webhook_events").delete().eq("event_id", eventId); else await db().from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("event_id", eventId);
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
