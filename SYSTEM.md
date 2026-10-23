# System

How the site is built and run. README.md has setup and the original design of
the camp flows; this file records what's true now and the traps.

## Stack and hosting

- Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, Prisma 7 with the
  pg adapter on **Supabase Postgres**. Read `node_modules/next/dist/docs/`
  before using Next APIs (see AGENTS.md).
- Hosted on **Netlify** (`@netlify/plugin-nextjs`); DNS stays at Cloudflare.
  Pushing to `main` deploys to production. `netlify.toml` holds the build
  settings and the secrets-scan exceptions (`SECRETS_SCAN_OMIT_KEYS`,
  `SECRETS_SCAN_OMIT_PATHS` for Next's compiler cache).
- Paystack (live keys, NGN) and Resend. With `PAYSTACK_SECRET_KEY` or
  `RESEND_API_KEY` blank, payments are simulated (`/camp/payment/simulate`,
  `/give/simulate`) and email is logged instead of sent.
- Per-request nonce CSP in `src/proxy.ts`. Env vars: see `.env.example`.

## Route groups

- `src/app/(site)`: public pages, `/camp/*`, `/give`.
- `src/app/(portal)/portal`: camp profile. Sign-in is **email + phone
  number**, no password or code; `0803…` and `+234803…` both match.
- `src/app/(admin)/admin`: staff, bcrypt passwords, roles `SUPER_ADMIN`,
  `ADMIN`, `FINANCE`, `REGISTRATION`, `LOGISTICS`, `USHER`. `GATE_ROLES`
  (super admin, admin, registration, logistics, usher; not finance) can use
  check-in.
- `src/app/t/[code]`: public ticket page the QR code opens; an admin visiting
  it during camp days admits the ticket.
- `src/app/api/webhooks/paystack`: Paystack webhook
  (`https://dominionhouse.org/api/webhooks/paystack`); unsigned requests get 401.
- `src/app/api/ticket-qr/[file]`: the ticket QR as a cached PNG for emails
  (Gmail drops `data:` images). Accepts only real 24-character tokens.

## Payments, tickets, email

- `settlePayment()` in `src/lib/registration.ts` is the **only** place a
  payment becomes real (callback, webhook, admin offline payment, waiver,
  manual registration, the record script). It's idempotent; on success it
  sends the receipt, and when the balance hits zero it issues the ticket and
  emails it. Don't settle payments any other way.
- Money is integer kobo. Instalment minimum: `min(₦10,000, total ÷ 5)`.
- Ticket emails link to the portal and spell out "sign in with your email and
  phone number"; the QR loads from `/api/ticket-qr/…`.
- Check-in: `/admin/check-in` has a phone camera scanner (native
  BarcodeDetector, or jsQR on iPhone/Firefox). It only admits during camp
  days, refuses unpaid and revoked tickets, and has undo.

## Data

- **One database for local and live.** Local writes are live writes.
- Timestamps: write and read them through Prisma (as the app does). Raw `pg`
  queries show the same columns an hour off, so don't compare raw SQL times
  with what the site shows.
- One registration per email per camp (`@@unique([campId, email])`).
- The programme lives in `ScheduleItem` rows, edited at `/admin/schedule`.
  `scripts/replace-schedule.ts` holds the 2027 import and **refuses to
  replace** once admins have edited items (add `--force` only if intended).
- Camp tagline, dates and settings live on the `Camp` row (`/admin/settings`).

## Scripts (`scripts/`)

| Script | Use |
|---|---|
| `import-lark.ts` | Imports LARK-form registrants (`importedFrom = "LARK form"`): 128 in October, 13 more from the 22 October export. Skips anyone already registered by email, phone or name; dry run unless `--commit`; sends no email |
| `import-cim.ts` | Imports the Fresh Fire Camp 2027 CIM form CSV as pending campus-student registrations; skips existing attendees, sends no email, and does not record payments or issue tickets. Dry run unless `--commit` |
| `record-paystack-payments.ts` | Records payments made on the Paystack page "2027 FRESH FIRE CAMP - DH" against registrants, credits `requested_amount` (not the fee), settles through `settlePayment`. Run with `npx tsx --conditions=react-server …`; dry run unless `--commit` |
| `replace-schedule.ts` | The 2027 programme import (guarded, see above) |

Scripts that import `src/lib` need `--conditions=react-server` and alias
`server-only` to `next/dist/compiled/server-only/empty.js` (see
`record-paystack-payments.ts`), and should set `APP_URL` to the live site
when they send email.

## Testing safely

- `.claude/launch.json` has `dominion-house` (port 3002, normal) and
  `dominion-house-mock` (port 3003) which blanks the Paystack and Resend keys,
  so checkout is simulated and email only logged. Only one `next dev` can run
  in the folder at a time.
- Do test registrations with `walkthrough.test@example.com`-style addresses
  on the mock server, then delete the registrant, its email-log rows and
  audit rows.
- Checks before pushing: `npx tsc --noEmit`, `npx eslint <changed files>`
  (a few older lint errors in admin import/new pages and the register form
  predate this work), `npm test` (69 tests).

## Media

- Videos in `public/video/` served through `mediaUrl()` (`src/lib/media.ts`),
  ready for Cloudflare R2 via `NEXT_PUBLIC_MEDIA_BASE_URL`. Netlify caches
  `/video/*` for a week.
- ffmpeg isn't installed globally; Remotion ships one
  (`npx remotion ffmpeg` / `ffprobe` inside `walkthrough-video/remotion`).
  Images are processed with `sharp` from the project's `node_modules`.
