export function LogoMark({ size = 36 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB52E" /><stop offset="1" stopColor="#DC3A1C" /></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#jg)" /><path d="M11 33h42c0 11.5-9 20-21 20S11 44.5 11 33z" fill="#fff" /><path d="M23 27.5c-3.2-3.4 3.2-5.6 0-10M32 27.5c-3.2-3.4 3.2-5.6 0-10M41 27.5c-3.2-3.4 3.2-5.6 0-10" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" fill="none" /><path d="M26 53.5h12" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" /></svg>);
}
export default function Logo({ light = false }: { light?: boolean }) {
  return (<span className="inline-flex items-center gap-2"><LogoMark /><span className={`font-display text-3xl font-bold tracking-tight ${light ? "text-white" : "text-[#7A1D11]"}`}>jamva</span></span>);
}
