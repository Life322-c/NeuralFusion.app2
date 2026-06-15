# NeuralFusion™ · app2

Cognitive Performance Operating System — v4.0  
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
   - **Facilitator** — enter cohort code + facilitator PIN
   - **Participant** — enter participant ID + cohort code

### Facilitator PIN
Default: `NF-FAC-2026`  
To change: update `FACILITATOR_PIN` constant in `index.html` (search for `NF-FAC-2026`).

### Cohort Codes
Cohort codes are free-form strings (e.g. `ORG2026-A`). Results are segmented by cohort code — use consistent casing.

### CFI Results Persistence
Results are saved to Supabase `enterprise_results` table in real time. Refreshing the page will reload all results for the active cohort.

---

## Changelog 

- **Removed `app.js`** — stale duplicate file, was never loaded
- **BottomNav hidden in Enterprise** — no navigation overlap inside the enterprise portal
- **Fixed `onExit` in role gate** — "Return to Platform" now correctly navigates home
- **Facilitator PIN gate** — facilitators must enter PIN `NF-FAC-2026` to access their portal
- **Enterprise results persisted** — CFI results saved to Supabase; survive page refresh
- **Pro price loaded from Supabase** — admin price changes propagate to all users/devices
- **Paystack error handling** — graceful error messages if payment script fails to load
- **Added `supabase_migration.sql`** — run once to create `enterprise_results` + `platform_settings` tables
