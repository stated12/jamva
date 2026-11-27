import Link from "next/link";
import { requireAdmin } from "@/lib/session";
export const metadata = { title: "Admin", robots: { index: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (<div className="wrap py-8"><div className="flex flex-wrap items-center gap-2 border-b border-line pb-4"><b className="mr-3 font-display text-2xl">Admin</b>{[["/admin", "Overview"], ["/admin/leads", "Registrations"], ["/admin/restaurants", "Restaurants & vendors"], ["/admin/cities", "Cities"], ["/admin/inbox", "Inbox"], ["/admin/drivers", "Riders"], ["/admin/orders", "Orders"], ["/admin/settings", "Fees & settings"]].map(([h, l]) => <Link key={h} href={h} className="chip !px-4 !py-2 text-sm hover:bg-kesar hover:text-white">{l}</Link>)}</div><div className="pt-6">{children}</div></div>);
}
