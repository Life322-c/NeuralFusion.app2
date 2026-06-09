# NeuralFusion™ — Post-Fix Deployment Guide

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
h1, h2, paragraph text, and a nav — so Google's crawler can index the site
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
long-term technical investment for organic growth.
