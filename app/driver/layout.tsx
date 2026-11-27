import Link from "next/link";
export const metadata = { title: "Rider app", robots: { index: false }, manifest: "/rider.webmanifest" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (<div className="wrap max-w-3xl py-6"><div className="flex items-center gap-2 border-b border-line pb-3"><b className="mr-3 font-display text-2xl">Rider</b>{[["/driver", "Deliveries"], ["/driver/earnings", "Earnings"]].map(([h, l]) => <Link key={h} href={h} className="chip !px-4 !py-2 text-sm hover:bg-kesar hover:text-white">{l}</Link>)}</div><div className="pt-5">{children}</div></div>);
}
