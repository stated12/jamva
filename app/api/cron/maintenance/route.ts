import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reconcilePayments } from "@/lib/payments";
import { refundOrder } from "@/lib/orders";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/** Daily safety net (Vercel Cron, needs the CRON_SECRET variable): settles payments whose webhook was lost, retries refunds that failed, and runs housekeeping if pg_cron is not enabled. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const out: Record<string, any> = {};
  try { out.reconcile = await reconcilePayments(); } catch (e: any) { out.reconcile = { error: String(e?.message || e) }; }
  try {
    const { data: due } = await db().from("orders").select("id").eq("payment_status", "refund_due").limit(20);
    for (const o of due || []) await refundOrder(o.id); out.refunds_retried = (due || []).length;
  } catch (e: any) { out.refunds = { error: String(e?.message || e) }; }
  try { const { data, error } = await db().rpc("housekeeping"); out.housekeeping = error ? { error: error.message } : data; } catch (e: any) { out.housekeeping = { error: String(e?.message || e) }; }
  return NextResponse.json({ ok: true, ...out });
}
