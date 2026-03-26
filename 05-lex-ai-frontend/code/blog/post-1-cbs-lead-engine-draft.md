# How We Took a B2B Tech Firm from 10% to 90% Qualified Leads Using AI

**Published:** March 2026
**Author:** Julien Gustinelli, Founder & Lead Engineer, LexAi
**Reading time:** ~6 min

---

Most B2B companies have the same lead problem. It's not that they can't find people — it's that 90% of the people they find are wrong.

That was exactly where Cloud Base Solutions stood when they came to us. Their sales team was spending hours on LinkedIn, buying contact lists, running Waalaxy sequences — and after all of it, maybe 1 in 10 contacts was actually someone they'd want to talk to. The other 9 were noise: wrong industry, wrong role, wrong company type, or just completely off-spec.

The frustrating part? They knew exactly who they were looking for. The problem was purely one of execution — there was no system that could find those people at scale.

We built one in three weeks.

---

## The Target

Cloud Base Solutions specializes in ServiceNow implementation and consulting. Their ideal client is a company that already uses ServiceNow — specifically, the person inside that company responsible for managing or owning the platform. Think ServiceNow Administrators, Platform Owners, ITSM Managers.

There's a catch that makes this harder than it sounds: ServiceNow has over 22,000 employees of its own, plus a massive ecosystem of independent consultants and implementation partners. If you're not careful, a search for "ServiceNow Administrator" on LinkedIn returns thousands of people who *work for* ServiceNow or consult on it — which is the opposite of what you want.

Cloud Base Solutions needed people who work *with* ServiceNow at other companies. That distinction is the whole game.

To make things even more specific, this list wasn't just for general outreach. They had a LinkedIn webinar coming up and needed a hyper-targeted invite list — people who would actually show up and have a reason to care.

---

## What Wasn't Working

Before we got involved, the team had three approaches:

**Manual LinkedIn search.** Time-intensive, inconsistent, and capped by how many profile views LinkedIn allows per day. Even with Sales Navigator, the filtering isn't precise enough to catch the ServiceNow-employee problem.

**Bought lists.** Cheap and fast, but built for breadth, not precision. 10% qualified leads was the result — meaning 90% of outreach time was wasted by definition.

**Waalaxy automation.** Better than doing it manually, but only as good as the list you feed it. Garbage in, garbage out. The automation worked fine — the lead source didn't.

The underlying issue wasn't effort or tooling. It was that nobody had built a qualification layer specific to their exact ICP.

---

## What We Built

We built a Google X-ray lead engine — a Google Sheets-based tool that runs multiple precision searches against LinkedIn using SerpAPI, deduplicates the results, filters out false positives, and delivers a clean, reviewable list with one click.

Here's how the filtering logic works:

**Five targeted search queries**, each designed to surface a different variation of the ideal profile:
- ServiceNow Administrators (excluding ServiceNow, Inc. employees)
- ServiceNow Platform Owners
- ITSM Managers who use ServiceNow
- IT Service Management professionals on ServiceNow
- ServiceNow Developers (internal, not consultant or freelance)

**Automatic exclusion filters** that strip out anyone who:
- Works directly for ServiceNow, Inc.
- Is listed as a consultant, partner, advisor, or implementation specialist
- Works freelance on ServiceNow projects

**Deduplication logic** that catches the same profile appearing across multiple searches and ensures it only shows up once in the final list.

**A clean review interface** inside Google Sheets — leads come in with Status, Name, Title, Company, and LinkedIn URL. The team marks each one Passed or Failed, exports the passed batch, and it's ready for outreach.

The whole thing runs with a single click from a custom menu inside their Google Sheet.

---

## The Hard Part

The technical build was straightforward. The hard part was getting the exclusion logic right.

This took several conversations with Rajendra, Cloud Base Solutions' internal IT Head and ServiceNow expert. He knew the ecosystem better than anyone — he could immediately spot a result that looked right on paper but was actually a consultant, or a ServiceNow employee using a non-standard job title.

We iterated through multiple versions of the filtering rules together. Each round, Rajendra would review a sample batch and flag the false positives. We'd trace back exactly why that result slipped through, adjust the logic, and run it again.

The main challenge was title ambiguity. "ServiceNow Platform Owner" sounds like an internal role — and usually is — but some consultants use the same title. We had to layer company-level checks on top of title checks to catch those cases reliably.

By the end, the engine was filtering with enough precision that the qualified rate jumped from 10% to 90%. Not 90% of a bad list — 90% of a much larger, fully automated list.

---

## The Result

One click. 35 qualified leads per batch. 90% hit rate against their exact ICP.

The webinar invite list was pulled, reviewed, and ready in a fraction of the time their manual process would have taken. And unlike a bought list or a Waalaxy-fed sequence, every person on it had been filtered against five specific criteria before a single message was sent.

Shajan Koshi, Co-Founder and CEO of Cloud Base Solutions, put it well:

*"We knew exactly who we were looking for — we just had no way to automate it. LexAi built a lead generation machine to our exact specifications. Now, with the click of a button, we're seeing 90% qualified leads based on 5 to 10 very specific variables. It's completely transformed how we approach client acquisition."*

---

## What This Looks Like for Other Businesses

The ServiceNow filter is specific to Cloud Base Solutions. But the approach is universal.

If you know who your ideal client is — their title, their tech stack, the type of company they work at, what they don't do — we can build the same kind of engine around your criteria. The exclusion logic, the search queries, the review interface — all of it gets scoped to your exact ICP.

Most businesses already know who they're looking for. They just don't have a system that can find them at scale without letting the wrong people through.

That's the gap we close.

---

*If you want this built for your business, book a free 30-minute call — no pitch, just a conversation about what's possible.*

**[Book a Free Call →](https://calendly.com/lexai/ai-implementation-introductory-chat)**
