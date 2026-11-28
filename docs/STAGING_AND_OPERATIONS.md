# Jamva: staging, load tests, backups, monitoring (manual steps)

These need your own Vercel and Supabase accounts, so they cannot be done from the code.

## 1. Staging (about 20 minutes, phone is enough)
1. Supabase: New project "jamva-staging" (region: Mumbai / ap-south-1). SQL editor: run 01, 02, 03, 04, 05, 06, 07 in order.
2. Vercel: Project > Settings > Git: connect a `staging` branch. Project > Settings > Environment Variables: add every variable again for the *Preview* environment using the STAGING Supabase keys and Razorpay TEST keys.
3. Settings > Functions: set Function Region to Mumbai (bom1).
4. Create test accounts: one customer, one approved restaurant with a menu, one approved rider.

## 2. Load test (k6, run from a laptop or k6 Cloud; never against production)
`k6 run -e BASE=https://<staging-url> -e STAGE=100 docs/load-test/k6-jamva.js` then 500, 1000, 2500, 5000.
Write down for each stage: p95 latency, error rate, Vercel function invocations and CPU, Supabase CPU / connections / egress.
Stop at the first stage that breaks the thresholds (p95 over 1.5 s or errors over 1 percent) and send me the numbers.

## 3. Production settings checklist
- Supabase: upgrade to Pro (daily backups, no pausing). Database > Extensions: enable pg_cron, then re-run 05_hardening.sql.
- Supabase > Authentication > URL Configuration: add https://jamva.in/auth/callback. Authentication > SMTP: add your email sender (needed for password reset).
- Supabase > Database > Replication: confirm tables jm_orders, jm_driver_locations, jm_job_signals are in the supabase_realtime publication (05 does this).
- Vercel: upgrade to Pro before taking real money. Set Function Region to Mumbai. Enable Spend Management alerts.
- Monitoring: point a free uptime monitor at https://jamva.in/api/health (alert by SMS/email). Turn on Vercel and Supabase email alerts.
- Recovery: Supabase Pro daily backups; practise one restore into the staging project once.
- Razorpay: test mode first. Webhook URL https://jamva.in/api/razorpay/webhook, events payment.captured, order.paid, payment.failed; copy the webhook secret into the RAZORPAY_WEBHOOK_SECRET variable.
