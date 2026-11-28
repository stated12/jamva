import Link from "next/link";
import Logo from "./Logo";
import { CartLink } from "./CartLink";
import Bell from "./Bell";
import { getProfile } from "@/lib/session";
import { logout } from "@/app/actions";
import { getT } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";
export default async function Header() {
  const p = await getProfile(); const { t, lang } = await getT();
  const nav = [["/restaurants", t("nav_restaurants")], ["/street-vendors", t("nav_street")], ["/drivers", t("nav_ride")], ["/partner", t("nav_partner")], ["/about", t("nav_about")]] as const;
  return (<header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
    <div className="wrap flex h-16 items-center gap-4"><Link href="/" aria-label="Jamva home"><Logo /></Link>
      <nav className="ml-6 hidden items-center gap-6 text-sm font-bold md:flex">{nav.map(([h, l]) => <Link key={h} href={h} className="hover:text-kesar-dark">{l}</Link>)}</nav>
      <div className="ml-auto flex items-center gap-1"><LangSwitch current={lang} />{p && <Bell />}<CartLink />
        {p ? (<details className="relative"><summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">{(p.full_name || p.email || "J").slice(0, 1).toUpperCase()}</summary>
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-white py-1 text-sm font-semibold shadow-2xl"><Link className="block px-4 py-2 hover:bg-soft" href="/orders">{t("menu_orders")}</Link><Link className="block px-4 py-2 hover:bg-soft" href="/account">{t("menu_account")}</Link><Link className="block px-4 py-2 hover:bg-soft" href="/partner/dashboard">{t("menu_partner")}</Link><Link className="block px-4 py-2 hover:bg-soft" href="/driver">{t("menu_rider")}</Link>{p.role === "admin" && <Link className="block px-4 py-2 hover:bg-soft" href="/admin">{t("menu_admin")}</Link>}<form action={logout}><button className="block w-full px-4 py-2 text-left hover:bg-soft">{t("signout")}</button></form></div></details>)
          : <Link href="/login" className="btn btn-dark !py-2">{t("signin")}</Link>}</div></div>
    <nav className="wrap flex gap-5 overflow-x-auto pb-2 text-sm font-bold md:hidden">{nav.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap">{l}</Link>)}</nav></header>);
}
