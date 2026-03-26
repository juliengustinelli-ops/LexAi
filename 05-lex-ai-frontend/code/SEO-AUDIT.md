# SEO Audit — lexaib2b.com
**Date:** March 26, 2026
**Business Type:** Agency / Services
**SEO Health Score: 58/100 (Grade: C)**

> Solid foundation with real proof points — held back by missing keywords, no blog, weak E-E-A-T signals, and two technical gaps. All fixable.

---

## Score Breakdown

| Category | Score | Key Finding |
|---|---|---|
| On-Page SEO | 55/100 | Two H1s on homepage, no canonical, no alt text on images |
| Content & Messaging | 68/100 | Strong proof points, weak keyword targeting |
| E-E-A-T | 50/100 | Founder named but no credentials, no external authority signals |
| Technical SEO | 72/100 | robots.txt + sitemap live (just added), missing canonical tags |
| Content Strategy | 35/100 | No blog, no keyword-targeted content, no long-tail coverage |
| Internal Linking | 60/100 | Navigation links only — no contextual deep linking |

---

## On-Page SEO Checklist

### Title Tag — Homepage
- **Status:** Needs Work
- **Current:** `LexAi – Custom AI Solutions. Real Results. Built Around Your Business.`
- **Issue:** 63 characters — slightly over 60, may truncate in SERPs. No clear primary keyword up front.
- **Recommended:** `LexAi | Custom AI Solutions for B2B Lead Generation & Automation`

### Meta Description — Homepage
- **Status:** Pass
- **Current:** "LexAi builds custom AI-powered solutions — from lead generation engines to automation tools to workflow systems — engineered around your exact business needs."
- **Note:** Good length, includes keywords, reads naturally.

### Heading Hierarchy — Homepage ⚠️
- **Status:** Fail
- **Issue:** Two H1s detected — "AI Solutions for B2B Growth Teams" (badge text) and "Built Around Your Business. Engineered to Perform." (actual headline). Google should see exactly one H1 per page.
- **Fix:** Change the badge text (`hero-badge`) from an H1 to a `<p>` or `<span>` — it's styled as a label, not a heading.

### Image Alt Text
- **Status:** Fail
- **Issue:** No alt text detected on any images on the homepage. This is both an SEO and accessibility miss.
- **Fix:** Add descriptive alt text to all images. At minimum: `hero.jpg` → `alt="LexAi custom AI solutions for B2B growth teams"`

### Internal Linking
- **Status:** Needs Work
- **Issue:** All internal links are nav/footer links. No contextual in-body links (e.g. mentioning "lead generation" in body copy and linking to the qualification engine page).
- **Fix:** Add 2-3 contextual links per page to relevant service pages.

### URL Structure
- **Status:** Pass
- **URLs are clean, lowercase, and readable.** `.html` extensions are slightly dated but not a ranking factor.

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|---|---|---|
| Experience | Present | 3 case studies with real stats and client quotes — solid |
| Expertise | Weak | Julien is named as Founder but no credentials, no prior roles listed, no LinkedIn link on the page |
| Authoritativeness | Weak | No external mentions, no press, no backlinks detected, no industry publications |
| Trustworthiness | Weak | No privacy policy linked from homepage, no physical address, no trust badges near CTAs |

**Biggest E-E-A-T gap:** The About page bio says "I built LexAi after spending years watching businesses lose time to manual processes" — but doesn't say where Julien worked before (Google Gemini, Amazon). That's the single most valuable credibility signal on the site and it's missing.

---

## Keyword Analysis

### Homepage Primary Keyword
- **Current target (implied):** "custom AI solutions"
- **Problem:** This is a low-volume, vague phrase. No one searches "custom AI solutions" — they search for the specific outcome they want.
- **Better primary keywords:**
  - `AI lead generation for B2B` — commercial intent, specific
  - `B2B lead qualification software` — transactional intent
  - `marketing automation for small business` — high volume

### Keyword Placement Issues
| Element | Status | Note |
|---|---|---|
| Primary keyword in title | Needs Work | Title is tagline-first, not keyword-first |
| Keyword in H1 | Needs Work | H1 is "Built Around Your Business" — no keyword |
| Keyword in first 100 words | Pass | "lead generation engines" appears early |
| Keyword in subheadings | Pass | "Precision Lead Generation" H3 present |
| Keyword in meta description | Pass | Good coverage |

### Secondary Keywords Missing from Site
These are high-opportunity terms the site should rank for but currently has no content targeting:
- `AI lead qualification tool`
- `B2B automation agency`
- `how to qualify leads with AI`
- `LLM workflow automation`
- `custom AI development for small business`
- `replace Clay.ai` / `Clay alternative`

---

## Technical SEO

| Check | Status | Note |
|---|---|---|
| robots.txt | ✅ Pass | Live, AI crawlers explicitly allowed |
| sitemap.xml | ✅ Pass | 7 pages, correct priorities |
| Canonical tags | ❌ Fail | No canonical tags detected on any page — duplicate content risk |
| Meta viewport | ✅ Pass | Present |
| HTTPS | ✅ Pass | SSL active |
| Schema markup | ✅ Pass | Organization, FAQPage, ItemList all added today |
| Google Search Console | ❓ Unknown | Sitemap should be submitted manually |

### Critical Fix — Canonical Tags
Add `<link rel="canonical" href="https://www.lexaib2b.com/[page-url]">` to every page's `<head>`. Without it, if the site is accessible at both `www` and non-`www`, or via HTTP and HTTPS, Google may treat them as duplicate pages and split ranking signals.

---

## Content Gap Analysis

This is the biggest SEO gap on the site. There is **zero blog or keyword-targeted content**. Every competitor in the AI/automation agency space that ranks organically has content targeting long-tail queries.

| Missing Content | Intent | Priority |
|---|---|---|
| "How to qualify B2B leads with AI" | Informational | High |
| "Clay vs custom AI lead engine" | Commercial | High |
| "What is B2B lead qualification?" | Informational | Medium |
| "How to automate LinkedIn prospecting" | Informational | High |
| "LLM prompt engineering for business" | Informational | Medium |
| "AI automation for small business" | Commercial | High |

**Bottom line:** Without content, the site can only rank for branded searches ("LexAi") and a handful of exact-match service terms. One blog post per week targeting a long-tail keyword would compound significantly over 6 months.

---

## Featured Snippet Opportunities

The GEO audit FAQ page (`geo-audit.html`) is the best candidate — the FAQ schema added today puts it directly in line for Google AI Overviews.

On the homepage, the "How We Work" section (Discover → Build → Deploy) is structured as a list and could capture a featured snippet for "how does AI implementation work" or "how long does custom AI development take."

**Quick win:** Add an H2 to the How We Work section that reads `How Does LexAi's AI Implementation Process Work?` — this targets the question format Google uses for featured snippets.

---

## Prioritized Recommendations

### Critical — Fix This Week
1. **Fix the double H1** — change `.hero-badge` from H1 to `<p>` tag (~5 min fix)
2. **Add canonical tags** to all pages (~15 min)
3. **Add alt text** to all images (~10 min)
4. **Add Google Search Console** and submit sitemap.xml

### High Priority — This Month
5. **Add prior experience to About page bio** — "Before LexAi, Julien worked on Google Gemini and at Amazon" is the single best credibility line missing from the site
6. **Add LinkedIn link** to About page and footer
7. **Add privacy policy link** to homepage footer (it exists at /privacy.html — just not linked from homepage)
8. **Rewrite title tag** to be keyword-first: `LexAi | AI Lead Generation & Automation for B2B`
9. **Add contextual internal links** — body copy should link to service pages

### Medium Priority — This Quarter
10. **Start a blog** — 1 post/week targeting long-tail queries. First post: "How We Went from 10% to 90% Qualified Leads Using AI" (built around the CBS case study)
11. **Add a "vs" or comparison page** — "LexAi vs Clay" targets high commercial-intent searchers
12. **Add H2 to How We Work** section targeting featured snippet format

---

## Revenue Impact Estimates

| Fix | Effort | Est. Impact |
|---|---|---|
| Fix double H1 + canonical tags | 30 min | Removes ranking signal dilution — foundational |
| Add alt text | 10 min | Accessibility + image search indexing |
| Add credentials to About page | 5 min | Improves E-E-A-T, trust for cold visitors |
| Blog (1 post/week for 3 months) | Ongoing | 500-2,000 new organic visitors/month within 6 months |
| "vs Clay" comparison page | 2 hours | High-intent commercial traffic, direct competitor comparison |

*Generated by `/market seo` — LexAi Marketing Suite*
