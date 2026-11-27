import Legal from "@/components/Legal";
import { getListing } from "@/lib/pricing";
export const metadata = { title: "Restaurant agreement" };
export const dynamic = "force-dynamic";
export default async function Page() { const l = await getListing(); return (<Legal title="Restaurant agreement"><p>This agreement is between Jamva and the restaurant that applies to be listed. By submitting the application you accept it.</p>
<h2>1. Listing and fees</h2><p>Jamva charges a flat yearly listing fee of ₹{l.yearly_fee.toLocaleString("en-IN")} plus {l.gst_percent}% GST. New restaurants receive {l.trial_days} days free from the day of approval. Jamva takes <b>no commission</b> on orders. If the listing is not renewed, the restaurant stops being shown to customers. Fees are non-refundable once the year starts, except where required by law.</p>
<h2>2. Your obligations</h2><ul><li>Hold and display a valid FSSAI licence or registration and keep it current</li><li>Prepare food hygienically and accurately describe dishes, veg and non-veg marking, and allergens on request</li><li>Charge the same menu price you charge in your restaurant. Do not add hidden or extra charges</li><li>Keep your open or closed status and item availability up to date</li><li>Accept or decline orders promptly and prepare accepted orders in the stated time</li></ul>
<h2>3. Payments and settlement</h2><p>Customer payments for food are collected by Jamva and paid out to the restaurant after deducting nothing for commission. Payout timing and method will be shared at onboarding and may be via Razorpay or bank transfer. Refunds for order failures attributable to the restaurant may be adjusted against payouts.</p>
<h2>4. Delivery</h2><p>Delivery is arranged by Jamva delivery partners, or by the restaurant&apos;s own riders where agreed. Hand over orders sealed and on time.</p>
<h2>5. Suspension and termination</h2><p>Jamva may suspend or remove a restaurant for food safety issues, repeated cancellations, false information or misconduct. Either party may end the agreement by written notice; the listing remains until the paid period ends.</p>
<h2>6. Data and conduct</h2><p>Customer details are shared only to fulfil orders and must not be used for marketing without consent.</p>
<h2>7. Law</h2><p>This agreement is governed by Indian law with jurisdiction in Ahmedabad, Gujarat.</p></Legal>); }
