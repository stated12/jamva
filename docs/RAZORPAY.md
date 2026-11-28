# Razorpay for Jamva: setup, test, go live

## Variables (Vercel > Project > Settings > Environment Variables)
| Name | Value | Needed |
| --- | --- | --- |
| RAZORPAY_KEY_ID | rzp_test_... or rzp_live_... | yes (you added it) |
| RAZORPAY_KEY_SECRET | its secret | yes (you added it) |
| RAZORPAY_WEBHOOK_SECRET | the secret you type when creating the webhook (step 2) | **yes, still missing** |
| CRON_SECRET | any long random string (20+ characters) | yes, for the daily safety job |
| NEXT_PUBLIC_SITE_URL | https://www.jamva.in | recommended |
`NEXT_PUBLIC_RAZORPAY_KEY_ID` is no longer needed. After adding or changing variables, redeploy (Deployments > latest > Redeploy).

## 1. Check the keys
Sign in as admin, open https://www.jamva.in/admin/health. The Razorpay box must show mode TEST or LIVE and "Keys accepted by Razorpay: OK".

## 2. Webhook (Razorpay Dashboard > Account & Settings > Webhooks > Add new webhook)
- URL: `https://www.jamva.in/api/razorpay/webhook` (use the exact address that opens without redirecting; Razorpay does not follow redirects)
- Secret: invent a long random string, paste the same string into RAZORPAY_WEBHOOK_SECRET in Vercel
- Events: payment.authorized, payment.captured, payment.failed, order.paid, refund.processed, refund.failed
- Test mode and Live mode have separate webhook lists. Create one in each mode you use, each with its own secret.

## 3. Test Mode run-through (before real money)
Test keys must be used on one deployment only: easiest is Vercel Preview (use rzp_test_ keys and the test webhook secret for the Preview environment), keep rzp_live_ for Production.
1. Place an online order on the test site. Pay with Razorpay's test card or test UPI (see Razorpay docs "Test Cards" / "Test UPI IDs"; the success and failure UPI test IDs are success@razorpay and failure@razorpay).
2. Success: the order page moves to "Order placed" and the restaurant dashboard shows it. Razorpay > Transactions shows Captured.
3. Failure: pay with the failing test UPI; the order stays "Awaiting payment", you can pay again on the same screen.
4. Refund: the restaurant rejects a paid order (or admin cancels). Razorpay > Transactions shows a refund; the order page says refunded.
5. Webhook delivery: Razorpay > Webhooks > the endpoint > logs should show 200 for each event. Admin > System check button "Check Razorpay for missed payments now" should report nothing missed.

## 4. Going live
- Production environment uses rzp_live_ keys + the live webhook + live webhook secret. Redeploy.
- Make one small real order (for example the cheapest item), confirm it appears, then refund it from the app (admin Orders > Refund). Settlement to your bank follows Razorpay's schedule.
- Razorpay Dashboard > Settings > Payment Capture: keep Automatic (the app also handles manual capture).
- Optional: Settings > Payment methods: enable UPI, cards, netbanking, wallets as you wish.

## What the app does automatically
- Every payment is verified by signature (checkout callback and webhook); the amount must match.
- Duplicate webhooks are ignored; a failed processing step returns an error so Razorpay retries (up to 24 hours).
- Failed payment attempts can be retried on the same order.
- Unpaid orders are cancelled after 30 minutes; a payment that arrives after that is refunded automatically.
- Restaurant rejection or admin cancellation of a paid order refunds the full amount. If Razorpay is unreachable the order is flagged "refund due" and retried daily (and by the admin Refund button).
- Daily job (Vercel Cron 21:30 UTC = 03:00 IST) settles any payment whose webhook was lost.

## Automated tests
`node docs/payments-test/test.js` runs 39 checks against a mock of the Razorpay API (not Razorpay itself). It needs Node 18+ and the TypeScript package; see the comments at the top of the files.
