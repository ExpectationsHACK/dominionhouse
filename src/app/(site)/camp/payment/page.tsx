import type { Metadata } from "next";
import Link from "next/link";
import { LookupForm } from "./lookup-form";
import { PayForm } from "./pay-form";
import { HillContours } from "@/components/site/hill-contours";
import {
  Arrow,
  ArrowLeft,
  ButtonLink,
  DataRow,
  Eyebrow,
  Meter,
  Notice,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { requireActiveCamp } from "@/lib/camp";
import { dateTimeLabel } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatKobo, percentPaid } from "@/lib/money";
import { isMockPayments } from "@/lib/paystack";
import { installmentPlanFor, minimumPayableKobo, totalsFor } from "@/lib/registration";
import { getPortalSession } from "@/lib/session";
import { normalizeEmail } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Camp payment",
  description:
    "Pay for Fresh Fire Camp Meeting 2027 in full or in instalments. Log in with the email and phone number you registered with.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  email?: string;
  welcome?: string;
  settled?: string;
  paid?: string;
}>;

export default async function PaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const camp = await requireActiveCamp();
  const session = await getPortalSession();

  // A device that's already signed in doesn't need to log in again; an
  // explicit ?email= (set by the login form below, or a confirmation-email
  // link) still takes priority, so a shared device can look up someone else
  // without signing out first.
  const email = params.email ? normalizeEmail(params.email) : (session?.email ?? null);

  const registrant = email
    ? await db.registrant.findUnique({
        where: { campId_email: { campId: camp.id, email } },
        include: {
          priceTier: true,
          payments: { orderBy: { createdAt: "desc" } },
          ticket: true,
        },
      })
    : null;

  const isOwnSession = Boolean(registrant && session?.registrantId === registrant.id);

  const totals = registrant ? totalsFor(registrant) : null;
  const minimum = registrant && totals ? minimumPayableKobo(camp, totals) : 0;
  const plan = registrant && totals ? installmentPlanFor(registrant, totals, minimum) : null;

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
          <Eyebrow className="text-brass">{camp.name}</Eyebrow>
          <h1 className="display mt-4 text-[clamp(2.75rem,9vw,7rem)]">Make a payment</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            Tell us who you are and we&apos;ll pull up your camp account.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/camp"
          className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-45 transition-colors hover:text-ink"
        >
          <ArrowLeft /> Back to camp
        </Link>

        {params.welcome ? (
          <Notice tone="success" title="You're registered." className="mb-8">
            Your camp profile is open and a confirmation is on its way to your inbox. Last step,
            payment.
          </Notice>
        ) : null}

        {isMockPayments ? (
          <Notice tone="warn" title="Test mode" className="mb-8">
            No Paystack keys are configured, so checkout is simulated. Add{" "}
            <code className="font-mono text-xs">PAYSTACK_SECRET_KEY</code> to <code className="font-mono text-xs">.env</code> to take real payments.
          </Notice>
        ) : null}

        {registrant ? (
          // The account itself proves who's looking at it, the login form
          // has nothing left to do, so it's gone rather than sitting beside
          // an account it didn't need to unlock.
          <div className="mx-auto max-w-2xl">
            {isOwnSession ? (
              <Notice tone="success" title="This device is signed in" className="mb-6">
                <p className="mt-1">
                  Showing {registrant.firstName} {registrant.lastName}&apos;s account below.{" "}
                  <Link href="/portal/login" className="font-semibold underline underline-offset-4">
                    Not you?
                  </Link>
                </p>
              </Notice>
            ) : null}

            <Account
              registrant={registrant}
              totals={totals!}
              minimum={minimum}
              plan={plan!}
              installmentsEnabled={camp.installmentsEnabled}
            />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[380px_1fr] lg:gap-14">
            {/* ── the gate ────────────────────────────────────────────────── */}
            <div>
              <Panel className="p-6">
                <Eyebrow>Step one</Eyebrow>
                <h2 className="display mt-3 text-3xl">Log in to your profile</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-45">
                  Use the email and phone number you registered with.
                </p>
                <div className="mt-6">
                  <LookupForm defaultEmail={email ?? ""} />
                </div>
              </Panel>
            </div>

            {/* ── the answer ──────────────────────────────────────────────── */}
            <div>{!email ? <Placeholder /> : <NotRegistered email={email} />}</div>
          </div>
        )}
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <div className="flex h-full min-h-[320px] flex-col justify-center border border-dashed border-ink/20 px-8 py-14">
      <Eyebrow>Waiting on you</Eyebrow>
      <p className="display mt-3 max-w-md text-4xl">
        Your balance, your ticket and your room all live behind that form
      </p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-45">
        We check the email against the camp register. If it&apos;s there, you can pay. If it
        isn&apos;t, we&apos;ll send you to register first, it takes about three minutes.
      </p>
    </div>
  );
}

function NotRegistered({ email }: { email: string }) {
  return (
    <div className="border border-ink bg-ink px-7 py-12 text-white sm:px-10 sm:py-16">
      <Eyebrow className="text-brass">Not on the register</Eyebrow>
      <p className="display mt-4 text-[clamp(2.25rem,5vw,3.75rem)]">
        We can&apos;t take a payment yet
      </p>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65">
        <span className="font-mono text-white">{email}</span> isn&apos;t registered for Camp
        Meeting 2027. Register first, it takes about three minutes, and you&apos;ll land right
        back here with your balance ready to pay.
      </p>
      <div className="mt-9 flex flex-wrap gap-2.5">
        <ButtonLink href="/camp/register" variant="brass" size="lg">
          Register now <Arrow />
        </ButtonLink>
        <ButtonLink href="/camp" variant="inverse" size="lg">
          What is camp?
        </ButtonLink>
      </div>
      <p className="mt-8 border-t border-white/15 pt-5 text-sm text-white/45">
        Registered with a different address? Try that one instead.
      </p>
    </div>
  );
}

type AccountRegistrant = {
  id: string;
  paymentPlan: string;
  installmentCount: number | null;
  firstInstallmentKobo: number | null;
  firstName: string;
  lastName: string;
  email: string;
  registrationCode: string;
  status: string;
  amountDueKobo: number;
  priceTier: { label: string } | null;
  payments: {
    id: string;
    reference: string;
    amountKobo: number;
    status: string;
    method: string;
    paidAt: Date | null;
    createdAt: Date;
  }[];
  ticket: { code: string } | null;
};

function Account({
  registrant,
  totals,
  minimum,
  plan,
  installmentsEnabled,
}: {
  registrant: AccountRegistrant;
  totals: ReturnType<typeof totalsFor>;
  minimum: number;
  plan: ReturnType<typeof installmentPlanFor>;
  installmentsEnabled: boolean;
}) {
  const successful = registrant.payments.filter((payment) => payment.status === "SUCCESS");

  return (
    <div className="space-y-6">
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Camp account</Eyebrow>
            <p className="display mt-2 text-4xl">
              {registrant.firstName} {registrant.lastName}
            </p>
            <p className="mt-2 font-mono text-sm text-ink-45">{registrant.registrationCode}</p>
          </div>
          <StatusBadge status={registrant.status} />
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="eyebrow text-ink-45">
              {formatKobo(totals.paidKobo)} of {formatKobo(totals.dueKobo)} paid
            </p>
            <p className="font-mono text-sm font-semibold">
              {percentPaid(totals.paidKobo, totals.dueKobo)}%
            </p>
          </div>
          <div className="mt-2.5">
            <Meter percent={percentPaid(totals.paidKobo, totals.dueKobo)} />
          </div>
        </div>

        <div className="mt-6">
          <DataRow label="Ticket" value={registrant.priceTier?.label ?? ", "} />
          <DataRow label="Camp fee" value={formatKobo(totals.dueKobo)} />
          <DataRow label="Paid" value={formatKobo(totals.paidKobo)} />
          <DataRow
            label="Balance"
            value={
              totals.balanceKobo > 0 ? (
                <span className="text-danger">{formatKobo(totals.balanceKobo)}</span>
              ) : (
                <span className="text-success">Cleared</span>
              )
            }
          />
          {plan.count ? (
            <DataRow
              label="Your plan"
              value={`${plan.count} instalments of ${formatKobo(plan.perInstalmentKobo ?? 0)}, ${plan.paidCount} of ${plan.count} paid`}
            />
          ) : registrant.paymentPlan === "INSTALLMENT" ? (
            <DataRow label="Your plan" value="Instalments, amount of your choosing" />
          ) : null}
        </div>
      </Panel>

      {totals.balanceKobo > 0 ? (
        <Panel className="p-6 sm:p-8">
          <Eyebrow>Step two</Eyebrow>
          <h2 className="display mt-2 text-3xl">
            {plan.count && plan.paidCount > 0
              ? `Instalment ${Math.min(plan.count, plan.paidCount + 1)} of ${plan.count}`
              : `Pay ${formatKobo(totals.balanceKobo)}`}
          </h2>
          <div className="mt-6">
            <PayForm
              registrantId={registrant.id}
              balanceKobo={totals.balanceKobo}
              minimumKobo={minimum}
              suggestedKobo={plan.suggestedKobo}
              planCount={plan.count}
              installmentsEnabled={installmentsEnabled}
            />
          </div>
        </Panel>
      ) : (
        <div className="border border-success/30 bg-success-soft p-6 sm:p-8">
          <Eyebrow className="text-success">Paid in full</Eyebrow>
          <p className="display mt-2 text-3xl text-ink">Nothing left to pay</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-70">
            {registrant.ticket
              ? `Your ticket ${registrant.ticket.code} was emailed to ${registrant.email}. You can also open it any time in your camp profile.`
              : "Your ticket is being issued and will land in your inbox shortly."}
          </p>
          <ButtonLink href="/portal" className="mt-6">
            Open my camp profile <Arrow />
          </ButtonLink>
        </div>
      )}

      {successful.length > 0 ? (
        <Panel>
          <div className="border-b border-ink/12 px-6 py-4">
            <Eyebrow>Payment history</Eyebrow>
          </div>
          <ul>
            {successful.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/10 px-6 py-4 last:border-0"
              >
                <div>
                  <p className="font-mono text-sm">{payment.reference}</p>
                  <p className="mt-0.5 text-xs text-ink-45">
                    {dateTimeLabel.format(payment.paidAt ?? payment.createdAt)} ·{" "}
                    {payment.method.replace("_", " ").toLowerCase()}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold">{formatKobo(payment.amountKobo)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
