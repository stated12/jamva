import Link from "next/link";
import Logo from "./Logo";
export const VENTURES = [
  { name: "ORIVANA", url: "https://orivana.org", line: "A global network for peace, education and humanity." },
  { name: "Stated", url: "https://app.stated.in", line: "A public accountability platform." },
  { name: "Credorium", url: "https://www.credorium.com", line: "Continuous decision intelligence: monitor, analyse, decide." },
  { name: "ASK Advertising", url: "https://www.askadvertising.co.in", line: "Advertising and brand communication." },
];
export default function Footer() {
  return (<footer className="mt-20 bg-ink text-white"><div className="wrap grid gap-10 py-14 md:grid-cols-4">
    <div className="md:col-span-1"><Logo light /><p className="mt-3 text-sm text-white/70">Pay for the food. Not the platform. Zero-commission restaurants, one honest delivery fee. Starting in Ahmedabad.</p></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">Jamva</p><ul className="mt-3 space-y-2 text-sm text-white/80"><li><Link href="/restaurants">Restaurants</Link></li><li><Link href="/partner">List your restaurant</Link></li><li><Link href="/drivers">Delivery partners</Link></li><li><Link href="/about">About &amp; founder</Link></li><li><Link href="/faq">FAQ</Link></li><li><Link href="/contact">Contact</Link></li></ul></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">Policies</p><ul className="mt-3 space-y-2 text-sm text-white/80"><li><Link href="/terms">Terms of use</Link></li><li><Link href="/privacy">Privacy policy</Link></li><li><Link href="/refunds">Cancellation &amp; refunds</Link></li><li><Link href="/delivery-policy">Delivery policy</Link></li><li><Link href="/restaurant-agreement">Restaurant agreement</Link></li></ul></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">Founded by</p><p className="mt-3 text-sm font-bold">Avdhesh Kumbhar</p><p className="text-sm text-white/70">Founder, ORIVANA Global Foundation</p><ul className="mt-3 space-y-1.5 text-sm text-white/80">{VENTURES.map((v) => <li key={v.name}><a href={v.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:decoration-kesar">{v.name}</a></li>)}</ul></div>
  </div><div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} Jamva. Prices include applicable taxes as shown at checkout. Restaurants are responsible for the food they prepare and their FSSAI licences.</div></footer>);
}
