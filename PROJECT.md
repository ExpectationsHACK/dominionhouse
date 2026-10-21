# Project

The Dominion House website (dominionhouse.org): the church's public site, online
giving, and the **Fresh Fire Camp Meeting 2027** system (registration, payment,
tickets, rooms, check-in). Fresh Fire 2027 runs **25–28 February 2027** at
Redemption City; camp opens 9:00 AM on the Thursday, the programme ends 2:00 PM
Sunday. Balances should be cleared by **18 February 2027**.

Owner and main contact: dhapostoliccenter@gmail.com. Public help address on the
site: dominionhs@gmail.com.

## What's live

| Area | Where | Notes |
|---|---|---|
| Public site | `/`, `/about`, `/vision`, `/locations`, `/events` | House blue header and footer, light-blue and black sections |
| Fresh Fire | `/camp` | Hero film, programme (from the database), testimonies, pricing cards with photos, checklist |
| Registration | `/camp/register` | Four steps: You, Church, Camp, Confirm |
| Payment | `/camp/payment` | Paystack checkout; instalments from ₦10,000 (lower for cheap tickets, up to 5 parts) |
| Camp profile | `/portal` | Sign in with email + phone, no password. Ticket, payments, room, schedule, announcements |
| Giving | `/give` | Legacy Place, Angel Partner monthly giving (Paystack subscriptions) |
| Admin | `/admin` ("Admin desk") | Registrants, payments, rooms, tickets, check-in scanner, schedule, announcements, content, partners, staff |

Ticket prices: Adult ₦50,000 · Campus Student ₦35,000 · Teenager ₦20,000 ·
Children ₦15,000 (free under 5). Adults can add children to their own
registration ("I'm coming with children": under 5 free, 5–11 ₦15,000 each).
"Guest" lighthouse registrations are free. First-time campers are shown as
**Guest** in the admin.

## How we work

- **Preview first, deploy on "deploy".** Every push to `main` is a Netlify
  production deploy (15 credits; the free plan has 300 a month, and traffic
  costs 10 credits/GB). Collect changes, preview them locally, and push once
  when the owner says "deploy". Never push a stream of small follow-ups.
- **The database is shared** between local development and the live site.
  Anything written locally is live immediately. Test registrations and
  payments only with payments and email switched off (see SYSTEM.md, "Testing
  safely") and delete the test data afterwards.
- **Never** make real payments, type real passwords, commit secrets or the
  large originals (`public/web-image-*`, `public/* price card.jpg`,
  `media-originals/`), or send email from tests.
- Commit messages end with the `Co-Authored-By` line the session asks for.

## Open items

- **Flip cards (animation #12) waiting on content:** Lighthouse service
  times and a scripture for each "What we believe" line. Not in
  `src/lib/church.ts`; don't invent them.
- **Programme:** "Thursday 25 February" shows as two day blocks on `/camp`
  (schedule data or day grouping); worth a look.
- **Security:** `finance@` and `registration@dominionhouse.org` admin
  accounts still used a password that was once in the public repo (October
  2026). Reset or disable them at `/admin/users`; consider making the GitHub
  repo private.
- **One email per registration** (database rule). Parents coming to camp
  should add children inside their own registration; a child registered on
  their own needs an email that isn't already used.
- **Cloudflare R2** for videos is ready in code but not switched on (set
  `NEXT_PUBLIC_MEDIA_BASE_URL` once the `dominion-house-media` bucket exists).
  Hero films are 1080p (~5–6 MB each); R2 would take them off Netlify's
  bandwidth.
- The old Cloudflare Worker `dominion-house` is unused and can be deleted.

## Explainer videos

`walkthrough-video/` (kept out of git): a registration and sign-in walkthrough
with friction notes, an 82-second all-in-one explainer, and a series of five
one-minute films (adults, parents with children, campus students, teenagers,
children), each vertical 1080×1920 and landscape 1920×1080, with `.srt`
subtitles and voiceover scripts. Built with Remotion; see
`walkthrough-video/README.md`. Copies of every MP4 are in the owner's
Downloads folder. The films are silent with captions until a voiceover is
recorded.
