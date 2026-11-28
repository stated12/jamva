import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { listAreas } from "@/lib/data";
import { getFees } from "@/lib/pricing";
import { razorpayConfigured } from "@/lib/env";
import { db } from "@/lib/db";
import CheckoutForm from "@/components/CheckoutForm";
export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const p = await requireUser("/checkout"); const [areas, fees] = await Promise.all([listAreas(), getFees()]);
  const { data: addr } = await db().from("addresses").select("*").eq("user_id", p.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!areas.length) redirect("/cart");
  return (<div className="wrap max-w-2xl py-10"><h1 className="text-4xl">Checkout</h1><CheckoutForm areas={areas.map((a: any) => ({ slug: a.slug, name: a.name, pincode: a.pincode || "" }))} defaults={{ name: p.full_name || "", phone: p.phone || "", line1: addr?.line1 || "", landmark: addr?.landmark || "", area: areas.find((a: any) => a.id === addr?.area_id)?.slug || "" }}
    cod={fees.cod_enabled} online={fees.online_enabled && razorpayConfigured()} email={p.email || ""} /></div>);
}
