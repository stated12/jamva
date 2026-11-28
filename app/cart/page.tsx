import CartView from "@/components/CartView";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Your cart" };
export default async function Page() {
  const { t } = await getT();
  return <CartView L={{ empty: t("c_empty"), pick: t("c_pick"), browse: t("h_browse"), from: t("c_from"), items: t("c_items"), fees: t("c_fees"), next: t("c_next"), go: t("c_go"), clear: t("c_clear") }} />;
}
