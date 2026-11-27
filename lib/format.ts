export const rupees = (paise: number | null | undefined) => "₹" + ((paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: (paise || 0) % 100 ? 2 : 0, maximumFractionDigits: 2 });
export const dateFmt = (d: string | Date | null | undefined) => d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
export const dayFmt = (d: string | Date | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "";
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
export const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
export function km(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, r = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
export const isPhone = (s: string) => /^(\+?91)?[6-9]\d{9}$/.test(s.replace(/[\s-]/g, ""));
export const normPhone = (s: string) => s.replace(/[\s-]/g, "").replace(/^\+?91/, "");
export const ORDER_STEPS = [["placed", "Order placed"], ["accepted", "Accepted by restaurant"], ["preparing", "Being prepared"], ["ready", "Ready for pickup"], ["picked_up", "On the way"], ["delivered", "Delivered"]] as const;
export const STATUS_LABEL: Record<string, string> = { pending_payment: "Awaiting payment", placed: "Order placed", accepted: "Accepted", preparing: "Preparing", ready: "Ready for pickup", picked_up: "On the way", delivered: "Delivered", cancelled: "Cancelled", rejected: "Declined by restaurant" };
