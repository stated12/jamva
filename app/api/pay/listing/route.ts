import { NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase-server";
import { myRestaurant } from "@/lib/session";
import { createListingPayment } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  let plan = ""; try { const b = await req.json(); plan = String(b?.plan || ""); } catch { /* no body */ }
  const u = await currentUser(); if (!u) return NextResponse.json({ ok: false, error: "login" }, { status: 401 });
  const r = await myRestaurant(); if (!r || r.status !== "approved") return NextResponse.json({ ok: false, error: "not_approved" }, { status: 409 });
  const p = await createListingPayment(r, u.id, plan); return NextResponse.json(p, { status: p.ok ? 200 : 503 });
}
