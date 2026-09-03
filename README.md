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

- **CFI-1.0 correction** — canonical CFI restored to the original 13-item instrument (was drifted to 16 items); scoring corrected to the true 13–65 raw range; fragmentation bands proportionally rescaled onto 13–65; dominant-brain calculation now excludes the Integration/E dimension (previously could be silently misattributed as the Analytical brain)
- **Longitudinal CFI tracking added** — per-user assessment numbering, `assessment_version`, `previous_assessment_id`, `score_change`, `band_changed`, and per-brain score columns on `cfi_results`; see `migration_cfi_longitudinal.sql`. Pre-correction rows are preserved and marked `legacy-unverified` rather than recalculated, since their answers were recorded against different question text under the same item IDs
- **"Your Cognitive Journey" added to Analytics** — per-assessment history and Four-Brain baseline→latest progress for users with 2+ completed CFI-1.0 assessments
- **Admin CFI analytics expanded** — median CFI, retest outcomes (improved/no-change/worsened), and band-movement counts, scoped to CFI-1.0 rows only so legacy scores never mix into the averages
- **CFI submission validation added** — rejects incomplete (≠13 answers), out-of-range (not 1–5), or out-of-range total (not 13–65) submissions client-side, mirrored by a DB check constraint
- **Public-site copy corrected** — CFI methodology pages and blog post updated from an incorrect "0 to 65" score range to the correct "13 to 65"
- **Removed "CFI Items" admin tab** — its editor wrote to browser `localStorage` only, so edits never reached real users on any other device; removed rather than left half-working, since CFI item content is now a fixed, validated instrument and shouldn't be UI-editable
- **`app.js` is the live app** — an earlier changelog line here claiming it was "removed" as a stale duplicate was incorrect; `index.html` loads it directly (`app.js?v=9`) and it contains all core application logic
- **BottomNav hidden in Enterprise** - no navigation overlap inside the enterprise portal
- **Fixed `onExit` in role gate** - "Return to Platform" now correctly navigates home
- **Facilitator PIN gate** - facilitators must enter PIN `NF-FAC-2026` to access their portal
- **Enterprise results persisted** - CFI results saved to Supabase; survive page refresh
- **Pro price loaded from Supabase** - admin price changes propagate to all users/devices
- **Paystack error handling** - graceful error messages if payment script fails to load
- **Added `supabase_migration.sql`** - run once to create `enterprise_results` + `platform_settings` tables
