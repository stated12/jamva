import { ORDER_STEPS } from "@/lib/format";
export default function Timeline({ status }: { status: string }) {
  const idx = ORDER_STEPS.findIndex(([s]) => s === status);
  return (<ol className="space-y-4">{ORDER_STEPS.map(([s, label], i) => { const done = idx >= i; const cur = idx === i; return (<li key={s} className="flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${done ? "bg-leaf text-white" : "bg-soft text-muted"} ${cur ? "ring-4 ring-leaf/25" : ""}`}>{done ? "✓" : i + 1}</span><span className={`font-semibold ${done ? "" : "text-muted"}`}>{label}</span></li>); })}</ol>);
}
