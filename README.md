# NeuralFusion · app2

Cognitive Performance Operating System - v4.0  
Built by Life Edet · [tryneuralFusion.com](https://www.tryneuralFusion.com)


## Stack

- React 18 (CDN + Babel runtime transpilation)
- Supabase (auth + database)
- Paystack (payments)
- PWA (manifest + service worker)
- Single-file deployment (`index.html` + `style.css`)



## Supabase Tables Required

Run `supabase_migration.sql` in your Supabase SQL editor before deploying, then the team migrations below.

| Table | Purpose |
|---|---|
| `profiles` | User profiles and `is_pro` flag (`is_enterprise` is no longer used) |
| `cfi_results` | Individual CFI assessment results |
| `lesson_progress` | Lesson completion tracking |
| `platform_settings` | Admin-controlled settings (e.g. pro price, team report threshold, starter seats) |
| `organisations`, `org_members`, `org_join_links` | Teams: one row per team, its members and roles, and its one join link |

Old tables `enterprise_results`, `cohorts`, `cohort_participants` and `facilitator_cohorts` are no longer used. `migration_unify_one_system.sql` converts what it can into teams and locks them (data kept).

---

## Teams (one system)

There is one team system. Enterprise and Organisation are the same thing.

1. Anyone creates a team (For Teams page, one field: team name) and becomes its owner.
2. The owner shares ONE team link (`/?team=TOKEN`, copy or WhatsApp).
3. People open it, create an account, auto-join (seat limit enforced server-side) and land in the assessment.
4. Each person: assess, train (5 lessons), retake. The owner sees completion status and aggregate team results (counts below the threshold are hidden).

Roles: `owner`, `admin`, `participant`. Admin tab **Teams** lists every team and lets a platform admin edit seats, switch a team on/off and set the minimum completions before team results show.

Database setup, in order: `migration_self_serve_teams.sql`, then `migration_unify_one_system.sql`.

---

## Changelog

- **Simple platform for individuals (plain language)**: Home is now one short page (signed out: what it is, how it works, one button; signed in: your next step). Navigation is Take the test, Lessons, My progress, Decisions, Team. Removed: the Architecture page, Resources page, in-app About page, the 7-stage "journey" layer, daily practice, and the old Analytics/Academy dashboards (now a simple My progress page and a short Lessons start screen). Renamed in plain words: CFI is the Thinking Clarity Test; bands are Clear and balanced / Mostly clear / Often scattered / Very scattered; Clarity Delta is "your change"; Integration Protocol is the Decision helper (Break it down, Check your gut, Look wider, Step back); Decision Vault is My decisions; thinking modes are ways of thinking; lesson titles rewritten. In-app Terms and Privacy updated to match. Fixed Home copy that wrongly said no account is needed (the test needs a free account). The deep text inside the lessons themselves is unchanged. `app.js?v=32`.
- **One team system (old Enterprise removed)**: there is now a single flow, create a team, share one link, assess, train, retake, results. Removed: the facilitator cohort portal, cohort codes (and the `?enterprise=1&code=` links), facilitator access and cohort admin tabs, Ent Results tab, enterprise results entry and storage, the per-user "Ent +" flag and `isEnterprise` state, email invitations (and `?invite=` links), admin onboarding of organisations, cohorts inside a team, and about 1,600 lines of dead code and styles. Converted: lesson player now lives only inside the team Training tab; member completion status now shows in People; Admin Enterprise/Organisations tabs became one Teams tab (seats, on/off, report threshold); the `enterprise` route is now `teams` and `invite` is now `join`; the Lessons upsell card, Home buttons, legal copy and static pages now describe teams. Old links (`?invite=`, `?enterprise=`) land on the team start page. Run `migration_unify_one_system.sql` after `migration_self_serve_teams.sql`. `app.js?v=31`.
- **One Teams entry point**: navigation now has a single item. Signed-out or team-less users see For Teams (create a team); anyone in a team sees My Team (their dashboard). Desktop nav, mobile bottom nav and footer all follow this. `app.js?v=30`.
- **Admin portal cleanup (dead features removed)**: removed the Broadcast, Branding, Lessons and Settings tabs. Broadcast, Branding and Lessons only saved to the admin's own browser (localStorage) and nothing in the app ever read them; the Maintenance and Open Registration toggles changed nothing. Also removed the unused enterprise price code, the unused create-organisation helper, the unreachable `teams` route and leftover constants. Admin tabs now: Overview, Users, CFI Results, Pro Subs, Organisations, Cohorts, Ent Results, Pricing (Pro price and Paystack key). Link audit: no dead links in any page, the app, or the sitemap. `app.js?v=29`.
- **One-dashboard self-serve teams**: Enterprise and Organisation are now a single flow. Anyone can create a team (Enterprise page, one field: team name) and becomes its owner. They share ONE team link (`/?team=TOKEN`, copy or WhatsApp). People who open it create an account, auto-join (seat limit enforced server-side) and land straight in the assessment. No founder contact, admin onboarding, cohort codes or email invitations in the normal path. The My Team dashboard opens on one guided path: add team, assess, train (5 lessons), retake, results. Owner/admin see the same path plus the link card and completion stats; Team Results, Training, People and Plan and Seats are tabs. Email invitations moved under People > Advanced and legacy invite links still work. Admin onboarding and the facilitator cohort portal are unchanged and still reachable (cohort code box on the Enterprise page). Removed the invoice package cards and pricing FAQ from the Enterprise page. Run `migration_self_serve_teams.sql` (it checks the assumed table names first and stops with a clear message if they differ). Starter seats default to 10 (`platform_settings.team_default_seats`). `app.js?v=28`.
- **Transformation layer (journey) added**: DISCOVER → UNDERSTAND → TRAIN → APPLY → REFLECT → MEASURE → INTEGRATE, built on top of existing data with no change to CFI scoring, auth, payments or RLS. New block `NEURALFUSION TRANSFORMATION LAYER (NFJ)` in `app.js`: a pure state function (`nfjComputeState`), one recommendation function (`nfjDevelopmentFocus`), one next-action function (`nfjNextAction`), milestones derived only from recorded activity, and components `NFJJourney`, `NFJNextAction`, `NFJTrainingPath`, `NFJFirstValue`, `NFJEvolution`, `NFJCFIScope`, `NFJEnterpriseJourney`. Home shows the journey + one next step (signed-in) or how it works + what the CFI does/doesn't measure (signed-out); the CFI result opens with a first-value block; Academy shows a personalised training path; Analytics shows Cognitive Evolution and milestones; the org Overview tab shows an honest team journey using only aggregate counts the `org_overview` RPC already returns. Decision Room labels now read DECIDE / REVIEW. Daily practice completions are now persisted: run `migration_practice_logs.sql` (until then practices show as "not recorded yet"). Decision/practice reads are cached for 15s to avoid duplicate requests. `app.js?v=16`.

- **Enterprise is now custom and admin-onboarded**: removed the self-serve team packages, the Paystack team checkout and the per-user enterprise unlock. Enterprise page now explains: contact the founder, admin onboards the organisation, owner invites the team. Admin → Teams tab removed; Admin → Organisations now holds the onboarding form (name, owner email, seats), seat editing and the report-threshold setting. Run `migration_admin_onboarding.sql` (review table names first). Also fixed: cohort invite links (`/?enterprise=1&code=`) were never read; setState-during-render in Admin cohort detail. `app.js?v=15`.
- **Decision Room + Decision Vault added**: the Integration Protocol (Decompose→Sense→Expand→Reflect→Fuse) now persists to Supabase instead of disappearing on exit. A "Save This Decision" panel on the Fuse screen captures a decision statement, confidence, next action, and review date, and writes to a new `decision_sessions` table (RLS: owner-only). A new "Decisions" nav destination (Decision Vault) lists open/awaiting-review/reviewed decisions, lets users reopen the full DECOMPOSE→FUSE record, and record an outcome (better/as expected/worse/still unfolding + lesson learned), closing the Decision → Action → Outcome → Reflection loop. Signed-in users see a "What are you trying to figure out?" panel on Home with quick entry into a new decision or the Vault, plus a nudge when a saved decision's review date has arrived. Run `migration_decision_sessions.sql` in the Supabase SQL editor before deploying. No AI/chatbot involved: Fuse synthesis remains the existing keyword-overlap logic (`synthesizeProtocol`), not a model call.
- **Analytics → Your Cognitive Journey** (now labelled "Your CFI history" / "Your decision record" under the new Cognitive Evolution): Analytics now shows decisions processed, decisions reviewed, average confidence, and one factual observation drawn only from the user's own recorded outcomes ("X of Y reviewed decisions turned out as expected or better"). No fabricated psychology, no unsupported diagnoses.
- **Under Pressure mode added**: a ~60–90 second, 5-question stabilization flow (facts / sensing / what else could be true / what matters most / next step), reachable from the Home "What are you trying to figure out?" panel. Saves into the same Decision Vault as a normal decision, so quick-pressure sessions still show up, get reviewed, and count toward the Cognitive Journey. Framed as a cognitive decision-support protocol, not therapy or mental-health treatment.
- **Security fix: removed the facilitator PIN**: the Enterprise facilitator gate previously checked a hardcoded string in app.js (`FACILITATOR_PIN`), shipped to every visitor and valid for every cohort. Facilitator access is now a `facilitator_cohorts` row linking a signed-in user to one cohort, grantable only by an admin (new "Facilitator access" widget in Admin → Cohorts), and enforced server-side via RLS, not by a secret in the JS bundle. Run `migration_facilitator_auth.sql`. Review its `enterprise_results` policies against what's currently live before applying, since this export doesn't include your existing policies on that table.
- **Cohorts moved off localStorage**: the Admin → Cohorts list (`nf_cohorts`) previously lived only in whichever browser last edited it, invisible from any other device or admin session. Cohorts now live in a Supabase `cohorts` table (admin-only RLS), so the codes it produces are also the real, checkable source of truth for facilitator_cohorts grants. Run `migration_cohorts.sql`. (Broadcasts and branding settings are still localStorage-only: left alone for now since neither is actually read anywhere outside the Admin editor yet, so there's no live feature to fix.)
- **Milestones added to Analytics**: first CFI, first integration session, first decision reviewed, 10 decisions processed, first Clarity Delta improvement, first lesson completed. Computed from data that's already recorded (CFI history, decisions, lesson progress); nothing fabricated, no XP or streak counters.
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
