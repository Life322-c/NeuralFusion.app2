# NeuralFusion funnel analytics

Privacy rules: first-party only, no cookies, no fingerprinting, no free text, no IP addresses stored.
Visitors who send Do Not Track or Global Privacy Control are not counted anonymously. Signed-in product events
use short numeric or token values only and never contain session text.

## Setup (once)
1. Run `migration_funnel_analytics.sql` in the Supabase SQL editor.
2. Deploy this folder. Static pages load `nf-track.js`; the app (`app.js`) sends its own events.
3. As an admin user: `select * from nf_funnel_report(30);` and `select * from nf_retention_report();`

## Where each funnel step comes from
| Step | Source | Event or table |
|---|---|---|
| Landing page visits | public_events | `landing_viewed` (app home), `marketing_page_viewed` (static pages) |
| CTA clicks | public_events | `primary_cta_clicked`, `secondary_cta_clicked`, `pathway_clicked`, `cta_clicked` |
| Registration | auth.users | signup date (the `signup` event is lost when email confirmation delays the session) |
| Assessment starts / completions | product_events | `cfi_started`, `cfi_completed` |
| First lesson starts | product_events | `first_lesson_started` |
| Lesson completions | product_events | `lesson_completed` |
| 7-day and 30-day retention | product_events | any event 7-13 / 30-36 days after signup; `session_started` is sent once per browser session |
| Subscription conversions | product_events | `subscription_converted` (after the server confirms the Paystack payment) |
| Team creation / participation | product_events | `team_created`; any event carrying `organisation_id` |
| Onboarding (new accounts) | product_events | `onboarding_started`, `onboarding_completed` (choice: cfi or explore), `onboarding_skipped` (step) |
| Institutional enquiries | public_events | `lead_submitted` (also stored in the business leads table) |

## Reading the numbers
- Steps are counted independently, not as a strict funnel. A later step can exceed an earlier one.
- Anonymous sessions and signed-in users cannot be joined. That is deliberate.
- Retention means a person came back and used the product. It does not measure improvement in thinking.
- Treat small counts with caution. Dozens of users make weekly retention rates noisy.
