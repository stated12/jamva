import { rupees } from "@/lib/format";
/** The honest bill. Numbers are an example; real prices are computed server-side at checkout. */
export default function BillExample({ fee = 3500, gstPct = 18 }: { fee?: number; gstPct?: number }) {
  const food = 30000, gst = Math.round((fee * gstPct) / 100), total = food + fee + gst;
  const rows: [string, string, boolean?][] = [["Food (same price as the restaurant menu)", rupees(food)], ["Platform fee", "₹0", true], ["Packaging charge", "₹0", true], ["Handling charge", "₹0", true], ["Delivery fee (about 3 km)", rupees(fee)], [`GST on delivery (${gstPct}%)`, rupees(gst)]];
  return (<div className="card p-5"><p className="kicker">An example bill</p><ul className="mt-3 divide-y divide-line text-sm">{rows.map(([a, b, z]) => (<li key={a} className="flex justify-between py-2"><span>{a}</span><span className={z ? "font-bold text-leaf" : "font-semibold"}>{b}</span></li>))}<li className="flex justify-between py-3 text-base font-extrabold"><span>You pay</span><span>{rupees(total)}</span></li></ul><p className="text-xs text-muted">Example for a ₹300 order. Delivery fee depends on distance and is always shown before you pay.</p></div>);
}
