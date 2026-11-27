import Legal from "@/components/Legal";
export const metadata = { title: "Privacy policy" };
export default function Page() { return (<Legal title="Privacy policy"><p>We collect only what we need to take and deliver your order and to run Jamva safely. This policy follows the Digital Personal Data Protection Act, 2023 and other applicable Indian law.</p>
<h2>What we collect</h2><ul><li>Account details: name, email, mobile number</li><li>Delivery details: address, landmark, optional location you choose to share</li><li>Order history and notes you write for the restaurant</li><li>Payment status from Razorpay (we never see or store full card, UPI PIN or bank details)</li><li>Basic device and usage data to keep the service secure and working</li></ul>
<h2>Why we use it</h2><ul><li>To process orders, calculate delivery fees and deliver food</li><li>To send order updates by in-app, push, email or WhatsApp notification</li><li>To prevent fraud, resolve disputes and meet legal obligations</li></ul>
<h2>Who we share it with</h2><p>The restaurant you order from and the delivery partner see your name, phone number, address and order so they can fulfil it. Payment is handled by Razorpay. Our hosting and database providers (Vercel and Supabase) process data on our behalf. We do not sell your data.</p>
<h2>Location</h2><p>We use your location only when you tap &quot;Use my exact location&quot; to give a more accurate delivery fee. You can instead choose your area.</p>
<h2>Retention and your rights</h2><p>We keep order records as long as needed for accounting and legal requirements. You may ask us to access, correct or delete your data, or withdraw consent, by emailing us. Some records must be kept by law.</p>
<h2>Security</h2><p>Data is encrypted in transit, access is restricted, and payments are processed on Razorpay&apos;s secure checkout.</p>
<h2>Children</h2><p>Jamva is not intended for people under 18.</p></Legal>); }
