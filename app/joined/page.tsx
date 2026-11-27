import Link from "next/link";
export const metadata = { title: "Thank you", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ city?: string; role?: string; live?: string }> }) {
  const sp = await searchParams; const city = (sp.city || "your city").slice(0, 60);
  return (<div className="wrap max-w-xl py-16 text-center"><h1 className="text-4xl">Thanks for registering!</h1>
    <p className="mt-4 rounded-2xl bg-leaf-soft p-4 font-semibold text-leaf">{sp.live === "1" ? `You are on our launch list for ${city}. Our team will call you with the next steps.` : `You're on our priority waitlist for ${city}. We're starting in Ahmedabad and will notify you as soon as we launch in your city.`}</p>
    <p className="mt-4 text-sm text-muted">Questions? Write to support@jamva.in.</p><Link href="/" className="btn btn-dark mt-6">Back to Jamva</Link></div>);
}
