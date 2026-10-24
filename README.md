# Snow Research Supply — Netlify storefront

A complete starter storefront with live product catalog, cart, admin inventory editor, hosted Stripe checkout, and order tracking. **Demo catalog entries are fictional placeholders** and are not real products.

## Setup
1. Create a Supabase project. Run `supabase/schema.sql` in its SQL editor.
2. In Supabase Authentication, create an email/password user for the administrator (disable public signup if not needed).
3. Run `insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');` in SQL editor.
4. Create a Stripe account and **obtain written confirmation your actual product category is permitted** before activating live payments. Research peptides may be prohibited or restricted by Stripe. If not approved, do not process these transactions through Stripe; replace the payment integration with an explicitly approving provider.
5. Copy `.env.example` to `.env` for local development, and set the same values under Netlify Site configuration → Environment variables. Never commit `.env` or share service-role keys.
6. `npm install`, then `npx netlify dev` to test frontend **and functions** locally.
7. Push to GitHub. In Netlify, Add new project → Import from Git → choose repo. Build command `npm run build`, publish directory `dist`.
8. Set Stripe webhook endpoint to `https://YOUR-DOMAIN/.netlify/functions/stripe-webhook`, listen to `checkout.session.completed`, and paste signing secret as `STRIPE_WEBHOOK_SECRET`.
9. Visit `/#admin` and log in. Add products, descriptions, price, stock and HTTPS image URLs.

## Notes / pre-launch checklist
- No fake certificates or unverified medical claims. Verify all real products, licensing, jurisdictions, age restrictions, labeling, and payment-processor acceptance.
- Add official company contact, legal terms, privacy, shipping, return/refund policies and applicable tax/shipping calculation before launch.
- Stripe checkout currently collects billing address only. Shipping fees, shipping address, tax, customer accounts, email receipts, fulfillment workflow, and automated refunds need configuration before selling shipped goods.
- Inventory is reduced on successful payment webhook. Simultaneous checkouts can oversell; for high volume, implement inventory reservation at checkout creation and release on expiration. If stock is insufficient when the webhook runs, fulfillment fails and needs manual reconciliation/refund.
- The demo mode is for layout preview only. Checkout requires configured Supabase and Stripe.
- For local testing use `npx netlify dev` rather than `npm run dev`, since checkout requires Netlify Functions.
