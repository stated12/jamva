import { NextResponse } from "next/server";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { settlePayment } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  let b: any; try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = b || {};
  if (typeof o !== "string" || typeof p !== "string" || typeof s !== "string" || !verifyCheckoutSignature(o, p, s)) return NextResponse.json({ ok: false }, { status: 400 });
  await settlePayment(o, p); return NextResponse.json({ ok: true });
}
