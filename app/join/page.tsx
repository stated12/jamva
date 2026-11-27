import Link from "next/link";
export const metadata = { title: "Join Jamva", description: "Join Jamva as a restaurant, street vendor or delivery partner." };
export default function Page() {
  const roles: [string, string, string, string][] = [["/partner/register", "Restaurant / Cloud Kitchen", "Zero commission. 90 days free, then one yearly fee.", "List your restaurant"], ["/street-vendors/join", "Street Vendor / Food Cart", "Two-minute signup. One-tap Open and Closed. 90 days free.", "Join as Street Vendor"], ["/driver/register", "Delivery Partner (Rider)", "Fair pay per delivery, shown before you accept. Weekly payouts.", "Ride with us"]];
  return (<div className="wrap max-w-3xl py-14"><p className="kicker">Join free</p><h1 className="text-4xl md:text-5xl">How would you like to join Jamva?</h1><p className="mt-2 text-muted">Live in Ahmedabad. Other cities can join the priority waitlist inside each form.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{roles.map(([h, t, d, c]) => <Link key={h} href={h} className="card block p-5 transition hover:-translate-y-1 hover:shadow-xl"><h2 className="text-2xl">{t}</h2><p className="mt-2 text-sm text-muted">{d}</p><span className="btn btn-primary mt-4 !py-2 text-sm">{c}</span></Link>)}</div></div>);
}
