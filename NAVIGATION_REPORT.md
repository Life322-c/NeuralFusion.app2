# Navigation upgrade: report

One public navigation (Pathways / Understand / Company) now runs on every signed-out surface: the React app's signed-out bar and all 24 static pages. Signed-in app navigation is preserved.

## 1. How it is built

| Piece | Role |
|---|---|
| `nf-nav.css` (new) | The only stylesheet for the public nav. Everything is namespaced `nfx-` and scoped under `.nfx-header`, so legacy page CSS (bare `ul`/`li`/`a`/`svg`/`header` rules, blog `li::before` bullets) cannot leak in. |
| `nf-nav.js` (new) | Behaviour on static pages. No dependencies, CSP-safe external file, loaded in `<head>` so the layout is right before first paint. |
| `app.js` | `PublicNav` (React) renders the same markup and classes for signed-out visitors, driven by the existing `NF_LINK_GROUPS`. `AnonMenu` was removed. |
| `tools/apply-nav.py` (new) | The site has no build step, so nav markup lives in each HTML page (it must work without JS). This script writes it to every page. `--check` fails if any page drifts or if `app.js` `NF_LINK_GROUPS` differs. |
| `commercial.css` / `commercial.js` | Old header/nav code removed (it was the second implementation). They load `nf-nav.*` like every other page. |

**Why a new file instead of editing `commercial.css`:** `commercial.css` sets global `body`/`.container`/`.btn` styles, so loading it on the legacy pages (About, Research, blog...) would restyle them. The shared nav therefore lives in its own scoped files.

Behaviour:
- **Desktop (900px and up):** three buttons with a chevron. Click opens, click again closes, opening another closes the first. Click or tap outside, Escape, or tabbing out also closes. Hover only styles; it never opens a panel. Arrow keys move through links, Home/End jump, Left/Right move between groups.
- **Mobile (under 900px):** the hamburger opens a full-screen overlay showing only the three categories. Each accordion expands independently with an animated chevron. The hamburger turns into an X. Escape closes it, Tab stays inside, background scroll is locked, the page behind is `inert`, and choosing a link closes the menu. Reopening starts collapsed.
- **Accessibility:** real `<button>`s with `aria-expanded` and `aria-controls`, `<nav aria-label="Primary">`, visible focus rings, 44px or larger targets, `prefers-reduced-motion` respected. Without JS the nav shows as a plain list.
- **Active page:** the current link gets `aria-current="page"` and gold styling, and its group gets a gold underline.

## 2. Files modified

New: `nf-nav.css`, `nf-nav.js`, `tools/apply-nav.py`, `tests/nav/*`, this report.

Modified:
- `app.js`: `PublicNav`, `NFMoreSection`, signed-out early return, signed-in menu upgrades, removed `AnonMenu`.
- `style.css`: removed unused `.nf-anon` rules.
- `index.html`: links `nf-nav.css`; cache versions `style.css?v=6`, `app.js?v=59`.
- `commercial.css`, `commercial.js`: old nav code removed.
- `DEPLOYMENT.md`: version note.
- 24 static pages (header, plus the head assets): `organisations`, `academic-partnerships`, `executive`, `research`, `about`, `methodology`, `contact`, `thinking`, `cognitive-fragmentation`, `decision-making`, `cognitive-performance`, `human-intelligence-ai`, `privacy`, `terms`, `404`, `blog/index` and the 9 blog articles. Their legacy `.legacy-nav` CSS was removed. A diff against the original confirms nothing else on these pages changed.

Not touched: Supabase/database, payments, CFI, lessons, teams, admin, forms, footers, routes.

## 3. Signed-in navigation

Desktop labels, order and admin condition are unchanged (Home, Decision Room, Thinking Feed, Thinking Mirror, Development, My Profile, My Team or For Teams, Admin only when `profile.is_admin === true`). Public dropdowns are not shown to signed-in users. On mobile:
- the same routes stay as the primary list;
- About and Blog now sit under a collapsed **More** section;
- the hamburger became a 44px X when open (it previously stayed as three lines);
- Escape closes the menu, background scroll is locked, and the menu has `aria-controls` and a dialog role.

## 4. Test report

Run with `python3 tests/nav/nav_e2e.py` and `python3 tests/nav/spa_e2e.py` (Playwright and Chromium). These ran in a real Chromium browser, not just by reading code.

**Result: 653/653 static checks and 119/119 app checks passed.** `lead_management.test.mjs` gives identical results on the original and modified `app.js`.

Covered:
- 19 public static pages at 1280px: loads, nav renders, no console errors, no horizontal overflow.
- Deep interaction checks on About, Research, Organisations, Blog and two blog articles (open/close, keyboard, focus ring, outside click).
- Active-page marker on 12 pages.
- All 15 distinct nav links return 200.
- Mobile and tablet emulation with touch: 320x568, 360x640, 390x844, 412x915 and 768x1024.
- Desktop widths 900, 1024, 1366 and 1920: one-line bar, nothing off-screen.
- Signed-out app on desktop and all five phone/tablet sizes.
- Deep links `/?view=cfi` and `/?view=teams`; in-app routing without a page reload.
- Signed-in and admin app, desktop and mobile.

## 5. Known limitations and things to check

1. **Not tested on real devices, Safari or Firefox.** Phones were emulated in Chromium. iOS Safari is the main risk (viewport toolbar behaviour, scroll lock). Please open the menu on a real iPhone and Android phone before release.
2. **The app was tested with a stand-in environment.** The sandbox had no network, so the app ran on a local React 19 build (production uses React 18.2 from the CDN) and a stubbed Supabase client with a simulated session. This proves the navigation, not real sign-in, payments, the CFI flow, dashboards or the database.
3. **Web fonts did not load offline**, so tests used fallback fonts. Real DM Sans and Space Mono are slightly different widths. The bar had spare room at 900px, but glance at 900 to 1000px.
4. **`tests/commercial_e2e.py` was not in the zip, so it was not run.** The README says it exists; if so it very likely selects the old nav (`.nav-toggle`, `#nf-nav`) and needs updating.
5. All 9 blog articles were opened in a browser at 1280px and 320px; the menu works on each. One existing issue, not caused by this work: `blog/your-brain-isnt-broken-its-fragmented` scrolls sideways at 320px because its comparison table is 483px wide (same on your original file). Wrap the table in a scrollable container to fix it.

Behaviour changes to be aware of:
- The old per-page badges in headers ("Research", "About the Founder", "Page Not Found", "Cognitive Intelligence") are gone, because they cannot fit beside the nav. The page titles still say the same.
- There is no separate "Home" link in the bar; the logo goes home.
- Blog articles and the 404 page, which had only a logo (or "Back to blog"), now have the full nav. The blog index "Start Free" button became the shared Take the CFI button.
- Signed-out "Blog" opens in the same tab (it previously opened a new tab). Signed-in "Blog" still opens a new tab.
- The bar is now a solid navy rather than translucent, so it looks identical over dark and cream pages.
- The tablet portrait range (under 900px) uses the hamburger.

Maintenance: edit the nav in `tools/apply-nav.py` and `NF_LINK_GROUPS` in `app.js`, run `python3 tools/apply-nav.py`, then `python3 tools/apply-nav.py --check`. Bump the `?v=` on `nf-nav.css` and `nf-nav.js` when they change.
