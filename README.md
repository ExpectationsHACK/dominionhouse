# Dominion House

Church site, visitor portal, registrant portal and the **Camp Meeting 2027 operating system** — one Next.js app.

The point of the camp system is that nobody works a spreadsheet. A person registers, pays (in full or in
instalments), and the moment their balance hits zero the system issues their ticket, emails it, and puts them in
a room. The camp desk only intervenes by exception.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components + Server Actions) |
| Styling | Tailwind v4, tokens defined in `src/app/globals.css` |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Payments | Paystack (NGN) — hosted checkout + HMAC-verified webhook |
| Email | Resend |
| Auth | Passwordless 6-digit codes (registrants), bcrypt + role (staff). Signed JWT cookies via `jose`. |

Both Paystack and Resend degrade gracefully: with no API key set, payments are **simulated** and email is
**logged to the outbox instead of sent**, so the whole flow is walkable before you have credentials.

---

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL` plus `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then create the schema and seed the camp:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Seeded staff logins (**change these before going live**):

| Email | Password | Role |
|---|---|---|
| admin@dominionhouse.org | DominionHouse2027! | Super admin |
| finance@dominionhouse.org | DominionHouse2027! | Finance |
| registration@dominionhouse.org | DominionHouse2027! | Registration |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Camp, prices, 48 rooms, 20 schedule items, staff |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Drop, re-migrate, re-seed |

---

## Routes

**Public** — `/`, `/vision`, `/locations`, `/events`, `/give`
**Camp** — `/camp` (overview, pricing, programme, FAQ), `/camp/register`, `/camp/payment`, `/camp/payment/callback`
**Registrant portal** — `/portal/login`, then `/portal`, `/portal/ticket`, `/portal/payments`, `/portal/room`, `/portal/schedule`
**Camp desk** — `/admin/login`, then dashboard, registrants (+ detail, + CSV export), payments, rooms, tickets,
check-in, schedule, announcements, visitors, email outbox, settings, staff
**Webhook** — `POST /api/webhooks/paystack`

---

## The flows that matter

### Registration → payment → ticket

1. `/camp/register` — four steps, one form. **The ticket price is derived from date of birth on the server**,
   never taken from the client, so nobody can pick the cheap ticket.
2. On submit: the registrant is created, their portal profile exists immediately (email *is* the login), a
   confirmation email goes out, and they land on `/camp/payment`.
3. `/camp/payment` is the gate. Name + email in. **Registered → the payment panel. Not registered → a "Register
   now" call to action.** A surname check stops an email address alone from exposing someone's record.
4. Paystack checkout → callback and webhook both converge on `settlePayment()`.

### `settlePayment()` — `src/lib/registration.ts`

The single place a payment becomes real. Called from the browser callback, the Paystack webhook, and the admin's
"record offline payment" action. **Idempotent** — safe to call twice for the same reference.

On settlement it recomputes the balance, and when it reaches zero it issues the ticket and emails it. Rooms are
never assigned here, or anywhere automatically — see below.

### Room sharing — `src/lib/rooms.ts`

Every bed is assigned by hand, from `/admin/rooms` or a registrant's page — there is no automatic allocator.
`assignManually()` still rejects a placement outright if: the room is full · gender doesn't match unless the
room is `MIXED` · the registrant doesn't meet the room's `minPosition` · the registrant isn't eligible for a
room right now (cancelled, or not paid per the camp's policy) · the room and registrant belong to different
camps. The capacity check runs inside a transaction that locks the target room row, so two staff assigning the
last bed at the same moment can't both succeed.

### Money

**All money is stored as an integer number of kobo.** Never introduce a float. `src/lib/money.ts` owns
conversion and formatting. Instalments are governed by `minFirstInstallmentKobo` on the camp record — a **flat floor** (₦10,000), not a
percentage, because the same minimum applies across tiers priced differently. Editable at `/admin/settings`.

Camp dates and deadlines are stored as instants. Seed them with an explicit `+01:00` offset, not `Z`: a `23:59Z`
deadline renders as the *next day* in West Africa Time, which once made the published payment deadline read a
day late.

---

## Going live

1. **Set real secrets.** `AUTH_SECRET` (32+ random bytes), `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`,
   `EMAIL_FROM` on a verified domain, and `APP_URL` on the real origin — payment callbacks and every email link
   are built from it.
2. **Point the Paystack webhook** at `https://your-domain/api/webhooks/paystack`. The callback alone is not
   enough; people close the tab, and the webhook is what guarantees the ticket still gets issued.
3. **Change the seeded staff passwords**, or delete those accounts from `/admin/users`.
4. **Set the real prices and dates** in `/admin/settings` rather than editing the seed.
5. `/admin/settings` shows whether payments and email are live or simulated — check it after deploying.

### Notes

- `pg` prints an SSL deprecation warning for `sslmode=require`. It's a notice, not an error; current behaviour is
  already `verify-full`. Set `sslmode=verify-full` explicitly to silence it, but check your host's certificate
  first.
- Repricing in settings only affects **new** registrations. Existing registrants keep the amount they agreed to —
  reprice them individually from their page if you need to.
- Every staff mutation is written to `AuditLog` and surfaced at the bottom of `/admin/users`.
- **The dev database is a free 24-hour Prisma Postgres instance and expires.** When builds start failing with
  "Your Postgres credentials are incorrect", it has been deleted. Provision another with `npx create-db`, put the
  new URL in `.env`, then `npx prisma migrate deploy && npm run db:seed` — the seed rebuilds everything. Claim it
  from the printed `claimUrl`, or swap in your own database, to stop this recurring.
- **After any schema change, restart `npm run dev`.** Turbopack caches the generated Prisma client, so a
  freshly generated model reads as `undefined` until the dev server is restarted (delete `.next` if it persists).

### The Fresh Fire carousel

`src/components/site/depth-card-carousel.tsx` is a local implementation of a perspective depth card: the card
tilts toward the pointer while the image, wash and type sit on different Z planes, so the front leads the back.
React Bits Pro ships a `depth-card-tw` component that does this, but it needs a paid `REACTBITS_LICENSE_KEY` and
a `registries` entry in `components.json`; neither is configured here, so the install cannot run. To swap it in
later, replace the `DepthCard` body — the carousel, data layer and admin around it stay as they are.

---

## Content status

Identity copy comes from the church's own vision and locations documents and lives in one place:
`src/lib/church.ts` — vision, mandate, the 5D strategy, the seven pillars, foundational scriptures, and
all nine campuses. Edit that file, not the pages.

**Still needed from the church** — the site says so on the page rather than inventing a value:

| Missing | Where it shows |
|---|---|
| Service times per campus | `/locations`, `/events` |
| Giving / bank account details | `/give` |
| Camp theme | `/camp` — dates, venue and prices are now set |
| Camp speakers and confirmed programme | `/camp`, admin schedule |
| Leadership names and bios | not yet built — no page invents them |
| Higher-resolution logo | the supplied JPEG is small (229×203 of artwork); an SVG or large PNG would render crisper |
| Fresh Fire card artwork | `/camp` carousel — drop files in `public/camp/`, point at them in `/admin/content`; cards fall back to an ember wash |

Camp venue, dates and prices are editable at `/admin/settings` and `/admin/schedule` without touching code.

## Design system

Ink `#0b0b0c` on Bone `#f2efe9`, with Meridian `#0f3d3e` carrying the brand and Brass `#21a1ff`, the blue
pulled straight from the logo, marking the moment. Display type is Anton set large and uppercase; body is
Inter Tight; data and codes are JetBrains Mono.

Two motifs do the heavy lifting: **hill contours** (`src/components/site/hill-contours.tsx`) — drawn, not
photographed, so it needs no asset pipeline and survives at any size — and the **perforated ticket stub**
(`src/components/camp/ticket-stub.tsx`), which is the signature element and appears in the portal, the ticket
email, and the admin scan screen.

Tokens live in `@theme` in `src/app/globals.css`. Change them there, not in components.
