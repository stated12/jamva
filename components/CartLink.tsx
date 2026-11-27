"use client";
import Link from "next/link";
import { useCart } from "./Cart";
import { rupees } from "@/lib/format";
export function CartLink() { const { count } = useCart(); return (<Link href="/cart" className="relative rounded-full p-2 hover:bg-soft" aria-label="Cart"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-chilli px-1 text-[11px] font-extrabold text-white">{count}</span>}</Link>); }
export function CartBar() { const { count, subtotal, name } = useCart(); if (!count) return null; return (<Link href="/cart" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-leaf px-5 py-3.5 font-bold text-white shadow-2xl md:bottom-5"><span>{count} item{count > 1 ? "s" : ""} · {name}</span><span>{rupees(subtotal)} · View cart →</span></Link>); }
