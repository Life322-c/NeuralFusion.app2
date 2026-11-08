# Lead management: testing report (2026-11-08)

Status words: implemented = code exists; tested = a test was run (type stated); deployed = live. **Nothing here is deployed.**

| Area | Implemented | Tested | How |
|---|---|---|---|
| Leads list, search, filters, follow-ups, notes, CSV, status | Existing, kept | Not re-run | Original code preserved; only additions made |
| NEW badge, Refresh button, 60s auto-refresh | Yes | Not run | Needs a browser + Supabase |
| Copy Email / Copy Details (modern API + legacy fallback) | Yes | Logic only | `tests/lead_management.test.mjs` (7 checks pass). Real clipboard not tested |
| Edit Lead modal, validation, saving/err states | Yes | Validation + error mapping only | Same test file. Not clicked in a browser |
| Delete Lead with confirmation | Yes | Not run | Needs Supabase |
| SQL functions (admin-only list/edit/delete, `phone` column) | Yes | **Not run** | No Postgres available; SQL never executed |
| Admin vs ordinary user permissions | Yes (server-side `profiles.is_admin` check) | **Not run** | Must be verified in the real project |
| Website forms save without email | No code change needed | Not run | `commercial.js` only calls `submit_business_lead` |
| CFI, auth, teams, lessons, payments | Untouched | Not run | Only the leads module of `app.js` changed |

## Manual checks to run after the migration
1. Submit one test enquiry on each of /organisations, /academic-partnerships, /executive, /contact: each appears in Admin > Leads.
2. Copy Email and Copy Details: paste and compare with the record.
3. Edit name, email, organisation, message; save; reload; changes persist.
4. Delete a test lead; reload; confirm with `select count(*) from public.business_leads where id::text = '<id>'` that it is 0.
5. As a non-admin signed-in user, call each `admin_*` function from the browser console: expect `not_authorised`.
