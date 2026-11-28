import { requestReset } from "../actions";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Reset password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; sent?: string }> }) {
  const sp = await searchParams; const { t } = await getT();
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">{t("fp_title")}</h1><p className="mt-1 text-muted">{t("fp_sub")}</p>
    <form action={requestReset} className="card mt-6 space-y-4 p-5">{sp.sent && <p className="rounded-xl bg-leaf-soft p-3 text-sm font-semibold text-leaf">{t("fp_sent")}</p>}{sp.e === "rate" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{t("lg_rate")}</p>}{sp.e === "link" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{t("fp_link")}</p>}
      <div><label className="label">{t("email")}</label><input name="email" type="email" required className="input" autoComplete="email" /></div><button className="btn btn-primary w-full">{t("fp_btn")}</button></form></div>);
}
