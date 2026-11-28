import Link from "next/link";
import Logo from "./Logo";
import { getT } from "@/lib/i18n";
export const VENTURES = [
  { name: "ORIVANA", url: "https://orivana.org", line: "A global network for peace, education and humanity." },
  { name: "Stated", url: "https://app.stated.in", line: "A public accountability platform." },
  { name: "Credorium", url: "https://www.credorium.com", line: "Continuous decision intelligence: monitor, analyse, decide." },
  { name: "ASK Advertising", url: "https://www.askadvertising.co.in", line: "Advertising and brand communication." },
];
export default async function Footer() {
  const { t } = await getT();
  return (<footer className="mt-20 bg-ink text-white"><div className="wrap grid gap-10 py-14 md:grid-cols-4">
    <div className="md:col-span-1"><Logo light /><p className="mt-3 text-sm text-white/70">{t("ft_tag")}</p></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">Jamva</p><ul className="mt-3 space-y-2 text-sm text-white/80"><li><Link href="/restaurants">{t("ft_rest")}</Link></li><li><Link href="/partner">{t("ft_list")}</Link></li><li><Link href="/street-vendors">{t("ft_street")}</Link></li><li><Link href="/drivers">{t("ft_drivers")}</Link></li><li><Link href="/join">{t("ft_join")}</Link></li><li><Link href="/about">{t("ft_about")}</Link></li><li><Link href="/faq">{t("ft_faq")}</Link></li><li><Link href="/contact">{t("ft_contact")}</Link></li></ul></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">{t("ft_policies")}</p><ul className="mt-3 space-y-2 text-sm text-white/80"><li><Link href="/terms">{t("ft_terms")}</Link></li><li><Link href="/privacy">{t("ft_privacy")}</Link></li><li><Link href="/refunds">{t("ft_refunds")}</Link></li><li><Link href="/delivery-policy">{t("ft_delpol")}</Link></li><li><Link href="/restaurant-agreement">{t("ft_agree")}</Link></li></ul></div>
    <div><p className="text-xs font-extrabold uppercase tracking-widest text-kesar">{t("ft_founded")}</p><p className="mt-3 text-sm font-bold">Avdhesh Kumbhar</p><p className="text-sm text-white/70">{t("ft_founder")}</p><ul className="mt-3 space-y-1.5 text-sm text-white/80">{VENTURES.map((v) => <li key={v.name}><a href={v.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:decoration-kesar">{v.name}</a></li>)}</ul></div>
  </div><div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} Jamva. {t("ft_legal")}</div></footer>);
}
