# Tests

| File | What it proves | What it does NOT prove | Run |
|---|---|---|---|
| `commercial_e2e.py` | Page loads, SEO tags, links, CTAs, analytics events, form validation, success and error handling, mobile layout, in headless Chromium against the static files | That the real database accepts the payload. The Supabase RPC is mocked. Not Safari or Firefox. Not a real phone | `python3 tests/commercial_e2e.py` (needs `pip install playwright` and `playwright install chromium`) |
| `csv_export.test.mjs` | CSV escaping and formula-injection protection used by Admin > Leads | The download in a browser | `node tests/csv_export.test.mjs` |
| `../supabase/functions/notify-lead/handler.test.mjs` | Edge function logic (auth, claim, send once, failure handling, templates, escaping) with a mocked `fetch` | That Resend or Supabase accept the real requests. Not run under Deno | `node supabase/functions/notify-lead/handler.test.mjs` (Node 22.18+) |
| `sql/business_leads_tests.sql` | RLS, grants, admin checks, validation, rate limit, duplicate protection, filters, updates, notification claim logic, against a real database | Needs a real Supabase project. **Written but never executed** | Paste into the Supabase SQL editor |
