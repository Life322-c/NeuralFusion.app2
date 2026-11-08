# NeuralFusion - Post-Fix Deployment Guide

## What Was Fixed

### 1. Canonical URL Casing (index.html + blog)
- **Before:** `https://tryneuralFusion.com/` (capital F)
- **After:** `https://tryneuralfusion.com/` (all lowercase)
- Applies to: canonical tag, og:url, og:image, twitter:image

### 2. Structured Data / JSON-LD (index.html)
Added two schema.org blocks:
- `WebSite` schema with author (Life Edet) and publisher
- `EducationalOrganization` schema with course offering and Four Brains keywords

### 3. SEO Content Layer (index.html)
Added a visually-hidden `<div id="seo-layer">` with real HTML content:
h1, h2, paragraph text, and a nav - so Google's crawler can index the site
even when JavaScript rendering is slow or fails. This is critical for a
React SPA with no SSR.

### 4. Blog Page SEO (blog/why-your-brain-cant-think-clearly.html)
Added complete missing meta tags:
- author, robots, canonical
- Open Graph (og:type=article, og:url, og:image, og:title, og:description, article:author)
- Twitter Card (card, site, title, description, image)
- JSON-LD Article schema
- Favicon and theme-color

### 5. sitemap.xml (new file)
Lists both pages:
- https://tryneuralfusion.com/
- https://tryneuralfusion.com/blog/why-your-brain-cant-think-clearly.html

### 6. robots.txt (new file)
- Allows all crawlers
- Disallows /api/ and /.supabase/
- Points to sitemap

### 7. vercel.json (new file)
- Security headers (X-Frame-Options, XSS protection, referrer policy)
- Correct Content-Type for sitemap.xml and robots.txt
- Aggressive caching for icons and CSS
- SPA rewrite rule so all routes resolve to index.html

### 8. manifest.json (fixed)
- Removed reference to missing icon-512.png (was causing a broken fetch)

---

## Deployment Steps

### Step 1: Deploy to Vercel
1. Replace all files in your Vercel project with these updated files
2. Commit and push to your GitHub repo (or drag-and-drop to Vercel dashboard)
3. Vercel will pick up vercel.json automatically

### Step 2: Verify robots.txt and sitemap are live
After deploy, confirm these URLs return content:
- https://tryneuralfusion.com/robots.txt
- https://tryneuralfusion.com/sitemap.xml

### Step 3: Submit to Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: https://tryneuralfusion.com/
3. Verify ownership (use the HTML file method or DNS record)
4. Go to Sitemaps → Submit new sitemap → enter: sitemap.xml
5. Use URL Inspection tool on https://tryneuralfusion.com/ → Request Indexing

### Step 4: Test structured data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Paste https://tryneuralfusion.com/ and verify schemas are detected

### Step 5: Test social sharing
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Paste your URL and confirm the og-image renders

---

## Remaining Considerations

### Icon-512.png
The manifest previously referenced a missing icon-512.png. You should create
a 512×512 version of your icon and add it to /icons/icon-512.png, then
restore that entry to manifest.json for full PWA compliance.

### Twitter / X Handle
@NeuralFusion is set as twitter:site. Confirm this account is active
and linked to your content.

### Long-term: Server-Side Rendering
The SEO content layer buys significant time but is not a permanent solution.
Consider migrating to Next.js for true SSR, which will make every page
fully crawlable with zero workarounds. This is the highest-leverage
long-term technical investment for organic growth


---

## Commercial pages and lead system (corrected 2026-11-07)

Status vocabulary used here and in `docs/TESTING_REPORT.md`: **implemented** (code exists), **tested** (a test was run; the report says what kind), **deployed** (live in your Supabase, Vercel or GTM). As delivered, **nothing in this section is deployed**, and the database and email parts have **not been run against a real Supabase project**.

New static routes: `/organisations`, `/academic-partnerships`, `/executive`, and a rebuilt `/contact`. Shared files: `commercial.css`, `commercial.js?v=2`. The pages are plain HTML; edit them directly. No platform file (`app.js`, `style.css`, `sw.js`, `index.html`, `vercel.json`) was changed in this pass.

Related docs: `docs/ENVIRONMENT.md`, `docs/ANALYTICS_GTM.md`, `docs/SECURITY_REVIEW.md`, `docs/TESTING_REPORT.md`, `tests/README.md`.

### Step 1: Database (required before the forms work)
1. Supabase dashboard > SQL editor > run `migration_business_leads.sql`. It is additive and idempotent: it creates a `private` schema, the `business_leads` table, indexes, one trigger and the functions. It does not drop, truncate or alter existing objects.
2. **Run `tests/sql/business_leads_tests.sql` in the same editor.** It needs at least one profile with `is_admin = true`, runs in one transaction and rolls back. A pass lists `PASS` lines. A failure stops with an error starting `FAIL <id>`. Do not go live before this passes.
3. Run the three verification queries at the bottom of the migration file.

### Step 2: Ship the site
Push to the Git repo connected to Vercel. `commercial.js` is cache-busted with `?v=2`. Then in the browser: open `/contact`, send a real test enquiry, and confirm it appears in Admin > Leads.

### Step 3: Email notifications (optional, not operational until you complete this and test it)
1. Resend: create an account, add and verify the sending domain (DNS records), create an API key with sending access only.
2. Install the Supabase CLI, then:
```bash
supabase login
supabase link --project-ref ckrxgbosyohcmjtemrvu
supabase secrets set RESEND_API_KEY=re_xxx \
  LEAD_NOTIFY_FROM="NeuralFusion Leads <leads@tryneuralfusion.com>" \
  LEAD_NOTIFY_TO="you@example.com" \
  LEAD_WEBHOOK_SECRET="$(openssl rand -hex 32)"
supabase functions deploy notify-lead --no-verify-jwt
```
   `--no-verify-jwt` is required because Database Webhooks carry no user JWT. The shared secret is the authentication. Note the secret value you generated.
3. Dashboard > Database > Webhooks > Create: table `public.business_leads`, event **Insert**, type **Supabase Edge Functions**, function `notify-lead`, method POST, add HTTP header `x-webhook-secret` with the same secret.
4. Test: submit a lead on the live site. Within a minute you should get an email. Confirm in the SQL editor:
```sql
select id, created_at, notified_at, notify_attempts, notify_error
from public.business_leads order by created_at desc limit 5;
```
   `notified_at` set means the email was handed to Resend. Check Edge Functions > notify-lead > Logs on failure.
5. Webhooks are not retried. The function supports a sweep that retries leads not notified within 3 days (`POST {"sweep": true}` with the secret header). Scheduling it with pg_cron and pg_net is **optional and untested**:
```sql
-- requires extensions pg_cron and pg_net, and a Vault secret named lead_webhook_secret
select cron.schedule('notify-lead-sweep', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://ckrxgbosyohcmjtemrvu.supabase.co/functions/v1/notify-lead',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'lead_webhook_secret')),
    body := '{"sweep": true}'::jsonb);
$$);
```
   Without a sweep, a failed notification is not retried automatically. Admin > Leads still shows every lead.

### Step 4: Analytics
Follow `docs/ANALYTICS_GTM.md` (variables, triggers, tags). Then verify in GTM Preview and GA4 DebugView.

### Step 5: Privacy policy
`privacy.html` now has section 08 for enquiries. It names Resend and Google Tag Manager. **If you do not deploy Resend, delete that bullet before publishing.** Have the policy reviewed (see manual steps in `docs/TESTING_REPORT.md`).

### Admin > Leads
Search, category, status and date filters, status updates, assignee, follow-up date, internal notes, source summary, follow-up due filter, CSV export. Every read and write goes through `admin_list_business_leads` and `admin_update_business_lead`, which check `profiles.is_admin` on the server. Date filters use the Africa/Lagos calendar day.

### Retention (manual, destructive: run deliberately)
The policy promises deletion or anonymisation after 24 months. Nothing runs automatically. Review, then delete:
```sql
select count(*) from public.business_leads
 where status <> 'converted' and coalesce(last_contacted_at, created_at) < now() - interval '24 months';
-- after reviewing:
-- delete from public.business_leads
--  where status <> 'converted' and coalesce(last_contacted_at, created_at) < now() - interval '24 months';
-- Erasure on request (replace the id):
-- delete from public.business_leads where id = '00000000-0000-0000-0000-000000000000';
```

### Deep links used by the new pages
`/?view=cfi|teams|lessons|protocol`, `/?auth=login|signup`. Allowlisted in `app.js` (`?v=58`).

### Rollback
The migration only adds objects. To disable the system without losing data: remove the Database Webhook, and revoke `execute` on `public.submit_business_lead` from `anon` and `authenticated`. To remove it entirely (destructive, you choose): `drop function` the seven functions, then `drop table public.business_leads`.
