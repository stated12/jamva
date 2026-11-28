import { redirect } from "next/navigation";
import { setNewPassword } from "../actions";
import { currentUser } from "@/lib/supabase-server";
import { getT } from "@/lib/i18n";
export const metadata = { title: "New password" };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams; const { t } = await getT();
  if (!(await currentUser())) redirect("/forgot?e=link");
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">{t("rp_title")}</h1>
    <form action={setNewPassword} className="card mt-6 space-y-4 p-5">{sp.e && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{sp.e === "expired" ? t("fp_link") : t("rg_invalid")}</p>}
      <div><label className="label">{t("pw8")}</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
      <div><label className="label">{t("rp_again")}</label><input name="again" type="password" required minLength={8} className="input" autoComplete="new-password" /></div><button className="btn btn-primary w-full">{t("rp_btn")}</button></form></div>);
}
