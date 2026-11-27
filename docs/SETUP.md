# Jamva: setup guide (phone-friendly)

## 1. Supabase
1. Create a project (or use an existing one: tables are prefixed `jm_` so they will not clash).
2. SQL editor: run `supabase/01_schema.sql`, then `supabase/02_seed.sql`.
3. Authentication > Providers > Email: keep Email on. You can leave "Confirm email" on or off, the app creates verified accounts itself.
4. Copy the Project URL, anon key and service role key (Settings > API).

## 2. Vercel
1. Import the GitHub repo. Framework: Next.js.
2. Add the environment variables from `.env.example` (at minimum the four "Required" ones). Redeploy after adding.

## 3. Admin login
Open `/register` on the live site and create an account with the admin email (`avdhesh20@gmail.com`). That email is pre-approved as admin in `02_seed.sql`, so Admin appears in the profile menu. Choose a strong password and change the one shared in chat.

## 4. Razorpay (when your account is approved)
1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same as the key id). Start with `rzp_test_` keys.
2. Razorpay dashboard > Webhooks: URL `https://YOUR-SITE/api/razorpay/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured`, `payment.failed`, `order.paid`.
3. Settings > Payment capture: set to automatic.
4. For approval Razorpay reviews your website: business details, Terms, Privacy, Refund and Delivery policy pages are included. Set `NEXT_PUBLIC_LEGAL_NAME`, address, email and phone first.
Until keys exist, customers can still order with cash on delivery and online payment is hidden.

## 5. Notifications
Order alerts for restaurants and customers go to every channel you configure: in-app bell (always), phone push (VAPID keys), email (SMTP) and WhatsApp (Meta Cloud API with an approved template). See `.env.example`.

## 6. Launch checklist
- [ ] Admin > Fees: check delivery fee tiers, GST and yearly fee
- [ ] Check area centres (`jm_areas`) look right for Ahmedabad
- [ ] Onboard 40 to 50 restaurants: they apply at /partner/register, you approve in Admin > Restaurants
- [ ] Replace legal name and address env vars
- [ ] Ask your CA about GST on listing fees and delivery fees, and about settlement of food payments to restaurants (Razorpay Route or bank transfer)
- [ ] Add real photos (see `docs/IMAGE_PROMPTS.md`)

## Phase 1 limits (be honest with restaurants)
- Delivery handover: until the driver app is live, the restaurant (or admin) marks "Handed to rider" and "Delivered".
- Restaurant payouts: orders are paid to your Razorpay account. Pay restaurants by bank transfer on a weekly schedule until Razorpay Route is set up.

## Rider (delivery partner) app
1. Run `supabase/03_drivers.sql` once in the Supabase SQL editor (after 01 and 02). Safe to re-run.
2. Riders sign up at `/driver/register`, you approve them in **Admin > Riders**, then they open `/driver`, go online and take deliveries.
3. Flow: restaurant accepts, online riders are alerted, a rider taps Take it (atomic, one rider only), picks up when the kitchen marks Ready, delivers. Cash-on-delivery is confirmed by the rider at delivery.
4. Rider pay = share of the delivery fee before GST (Admin > Fees & settings > Rider pay). Record weekly payouts and cash handed in under Admin > Riders. Admin can also assign or unassign a rider on any order (Admin > Orders).
5. The restaurant and admin "Handed to rider / Delivered" buttons still work as a fallback.
