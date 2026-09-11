# NeuralFusion™ · app2

Cognitive Performance Operating System - v4.0  
Built by Life Edet · [tryneuralFusion.com](https://www.tryneuralFusion.com)


## Stack

- React 18 (CDN + Babel runtime transpilation)
- Supabase (auth + database)
- Paystack (payments)
- PWA (manifest + service worker)
- Single-file deployment (`index.html` + `style.css`)



## Supabase Tables Required

Run `supabase_migration.sql` in your Supabase SQL editor before deploying.

| Table | Purpose |
|---|---|
| `profiles` | User profiles, `is_pro`, `is_enterprise` flags |
| `cfi_results` | Individual CFI assessment results |
| `lesson_progress` | Lesson completion tracking |
| `platform_settings` | Admin-controlled settings (e.g. pro price) |
| `enterprise_results` | Enterprise cohort CFI records (pre/post) |

---

## Enterprise System

### Accessing Enterprise
1. Purchase Enterprise access (₦50,000 one-time via Paystack)
2. Navigate to Enterprise in the nav
3. Select role:
   - **Facilitator** - enter cohort code + facilitator PIN
   - **Participant** - enter participant ID + cohort code

### Facilitator PIN
Default: `NF-FAC-2026`  
To change: update `FACILITATOR_PIN` constant in `index.html` (search for `NF-FAC-2026`).

### Cohort Codes
Cohort codes are free-form strings (e.g. `ORG2026-A`). Results are segmented by cohort code - use consistent casing.

### CFI Results Persistence
Results are saved to Supabase `enterprise_results` table in real time. Refreshing the page will reload all results for the active cohort.

---

## Changelog

- **Decision Room + Decision Vault added**: the Integration Protocol (Decompose→Sense→Expand→Reflect→Fuse) now persists to Supabase instead of disappearing on exit. A "Save This Decision" panel on the Fuse screen captures a decision statement, confidence, next action, and review date, and writes to a new `decision_sessions` table (RLS: owner-only). A new "Decisions" nav destination (Decision Vault) lists open/awaiting-review/reviewed decisions, lets users reopen the full DECOMPOSE→FUSE record, and record an outcome (better/as expected/worse/still unfolding + lesson learned), closing the Decision → Action → Outcome → Reflection loop. Signed-in users see a "What are you trying to figure out?" panel on Home with quick entry into a new decision or the Vault, plus a nudge when a saved decision's review date has arrived. Run `migration_decision_sessions.sql` in the Supabase SQL editor before deploying. No AI/chatbot involved: Fuse synthesis remains the existing keyword-overlap logic (`synthesizeProtocol`), not a model call.
- **Analytics → Your Cognitive Journey**: Analytics now shows decisions processed, decisions reviewed, average confidence, and one factual observation drawn only from the user's own recorded outcomes ("X of Y reviewed decisions turned out as expected or better"). No fabricated psychology, no unsupported diagnoses.
- **Under Pressure mode added**: a ~60–90 second, 5-question stabilization flow (facts / sensing / what else could be true / what matters most / next step), reachable from the Home "What are you trying to figure out?" panel. Saves into the same Decision Vault as a normal decision, so quick-pressure sessions still show up, get reviewed, and count toward the Cognitive Journey. Framed as a cognitive decision-support protocol, not therapy or mental-health treatment.
- **Security fix: removed the facilitator PIN**: the Enterprise facilitator gate previously checked a hardcoded string in app.js (`FACILITATOR_PIN`), shipped to every visitor and valid for every cohort. Facilitator access is now a `facilitator_cohorts` row linking a signed-in user to one cohort, grantable only by an admin (new "Facilitator access" widget in Admin → Cohorts), and enforced server-side via RLS, not by a secret in the JS bundle. Run `migration_facilitator_auth.sql`. Review its `enterprise_results` policies against what's currently live before applying, since this export doesn't include your existing policies on that table.
- **Cohorts moved off localStorage**: the Admin → Cohorts list (`nf_cohorts`) previously lived only in whichever browser last edited it, invisible from any other device or admin session. Cohorts now live in a Supabase `cohorts` table (admin-only RLS), so the codes it produces are also the real, checkable source of truth for facilitator_cohorts grants. Run `migration_cohorts.sql`. (Broadcasts and branding settings are still localStorage-only: left alone for now since neither is actually read anywhere outside the Admin editor yet, so there's no live feature to fix.)
- **Milestones added to Analytics**: first CFI, first integration session, first decision reviewed, 10 decisions processed, first Clarity Delta™ improvement, first lesson completed. Computed from data that's already recorded (CFI history, decisions, lesson progress); nothing fabricated, no XP or streak counters.
- **Awaiting-review indicator in navigation**: a quiet dot next to "Decisions" (desktop nav label, mobile bottom-nav icon) when a saved decision's review date has arrived. This is the extent of "notifications" this pass adds: real push or email reminders would need backend infra this project doesn't have yet (a scheduled Supabase Edge Function plus either Web Push subscriptions or an email provider): happy to scaffold that next if you want it, rather than fake it with something that doesn't actually deliver.
- **CFI-1.0 correction**: canonical CFI restored to the original 13-item instrument (was drifted to 16 items); scoring corrected to the true 13–65 raw range; fragmentation bands proportionally rescaled onto 13–65; dominant-brain calculation now excludes the Integration/E dimension (previously could be silently misattributed as the Analytical brain)
- **Longitudinal CFI tracking added**: per-user assessment numbering, `assessment_version`, `previous_assessment_id`, `score_change`, `band_changed`, and per-brain score columns on `cfi_results`; see `migration_cfi_longitudinal.sql`. Pre-correction rows are preserved and marked `legacy-unverified` rather than recalculated, since their answers were recorded against different question text under the same item IDs
- **"Your Cognitive Journey" added to Analytics**: per-assessment history and Four-Brain baseline→latest progress for users with 2+ completed CFI-1.0 assessments
- **Admin CFI analytics expanded**: median CFI, retest outcomes (improved/no-change/worsened), and band-movement counts, scoped to CFI-1.0 rows only so legacy scores never mix into the averages
- **CFI submission validation added**: rejects incomplete (≠13 answers), out-of-range (not 1–5), or out-of-range total (not 13–65) submissions client-side, mirrored by a DB check constraint
- **Public-site copy corrected**: CFI methodology pages and blog post updated from an incorrect "0 to 65" score range to the correct "13 to 65"
- **Removed "CFI Items" admin tab**: its editor wrote to browser `localStorage` only, so edits never reached real users on any other device; removed rather than left half-working, since CFI item content is now a fixed, validated instrument and shouldn't be UI-editable
- **`app.js` is the live app**: an earlier changelog line here claiming it was "removed" as a stale duplicate was incorrect; `index.html` loads it directly (`app.js?v=9`) and it contains all core application logic
- **BottomNav hidden in Enterprise** - no navigation overlap inside the enterprise portal
- **Fixed `onExit` in role gate** - "Return to Platform" now correctly navigates home
- **Facilitator PIN gate** - facilitators must enter PIN `NF-FAC-2026` to access their portal
- **Enterprise results persisted** - CFI results saved to Supabase; survive page refresh
- **Pro price loaded from Supabase** - admin price changes propagate to all users/devices
- **Paystack error handling** - graceful error messages if payment script fails to load
- **Added `supabase_migration.sql`** - run once to create `enterprise_results` + `platform_settings` tables
