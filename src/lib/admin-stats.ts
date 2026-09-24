import "server-only";
import { db } from "@/lib/db";
import { occupancySummary } from "@/lib/rooms";

/** One round trip's worth of numbers for the camp desk dashboard. */
export async function campDashboard(campId: string) {
  const [
    total,
    byStatus,
    byCategory,
    byPosition,
    collected,
    dueAggregate,
    ticketsIssued,
    checkedIn,
    accommodationNeeded,
    occupancy,
    recentRegistrants,
    recentPayments,
    failedEmails,
    newVisitors,
  ] = await Promise.all([
    db.registrant.count({ where: { campId, status: { not: "CANCELLED" } } }),
    db.registrant.groupBy({
      by: ["status"],
      where: { campId },
      _count: { _all: true },
    }),
    db.registrant.groupBy({
      by: ["category"],
      where: { campId, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { amountDueKobo: true },
    }),
    db.registrant.groupBy({
      by: ["position"],
      where: { campId, status: { not: "CANCELLED" } },
      _count: { _all: true },
    }),
    db.payment.aggregate({
      where: { status: "SUCCESS", registrant: { campId } },
      _sum: { amountKobo: true },
      _count: { _all: true },
    }),
    db.registrant.aggregate({
      where: { campId, status: { not: "CANCELLED" } },
      _sum: { amountDueKobo: true },
    }),
    db.ticket.count({ where: { registrant: { campId } } }),
    db.ticket.count({ where: { registrant: { campId }, status: "CHECKED_IN" } }),
    db.registrant.count({
      where: { campId, status: { not: "CANCELLED" } },
    }),
    occupancySummary(campId),
    db.registrant.findMany({
      where: { campId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { priceTier: true },
    }),
    db.payment.findMany({
      where: { status: "SUCCESS", registrant: { campId } },
      orderBy: { paidAt: "desc" },
      take: 6,
      include: { registrant: true },
    }),
    db.emailLog.count({ where: { status: "FAILED" } }),
    db.visitor.count({ where: { status: "NEW" } }),
  ]);

  const statusCount = (status: string) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  const collectedKobo = collected._sum.amountKobo ?? 0;
  const expectedKobo = dueAggregate._sum.amountDueKobo ?? 0;

  return {
    total,
    paid: statusCount("PAID"),
    partiallyPaid: statusCount("PARTIALLY_PAID"),
    pending: statusCount("PENDING"),
    cancelled: statusCount("CANCELLED"),
    collectedKobo,
    expectedKobo,
    outstandingKobo: Math.max(0, expectedKobo - collectedKobo),
    paymentCount: collected._count._all,
    ticketsIssued,
    checkedIn,
    accommodationNeeded,
    occupancy,
    unroomed: Math.max(0, accommodationNeeded - occupancy.filled),
    byCategory: byCategory.map((row) => ({
      category: row.category,
      count: row._count._all,
      expectedKobo: row._sum.amountDueKobo ?? 0,
    })),
    byPosition: byPosition
      .map((row) => ({ position: row.position, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    recentRegistrants,
    recentPayments,
    failedEmails,
    newVisitors,
  };
}
