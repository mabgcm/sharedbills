// src/app/page.tsx
import { splitBillParts, Bill, Payment } from "../lib /calc";

/**
 * Fetch neighbor-visible data from our server route.
 * Works in production and in local dev.
 */
async function getPublicData() {
  // Try relative (works in most SSR cases)
  try {
    const res = await fetch("/api/public-data", { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    /* ignore and try absolute */
  }

  // Fallback to absolute URL via env (set NEXT_PUBLIC_BASE_URL on Vercel)
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"; // local fallback for dev
  const res2 = await fetch(`${base}/api/public-data`, { cache: "no-store" });
  return res2.json();
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 shadow flex flex-col">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-lg font-semibold ${highlight ?? ""}`}>
        ${Number(value || 0).toFixed(2)}
      </span>
    </div>
  );
}

export default async function Page() {
  // data: { bills, payments, totals }
  const data = await getPublicData();

  const bills: Bill[] = data?.bills || [];
  const payments: Payment[] = data?.payments || [];
  const totals =
    data?.totals || ({
      totalNeighborShare: 0,
      neighborPaid: 0,
      balance: 0,
    } as {
      totalNeighborShare: number;
      neighborPaid: number;
      balance: number;
    });

  // Group bills by period (e.g., "2025-11")
  const billsByPeriod: Record<string, Bill[]> = {};
  bills.forEach((bill) => {
    (billsByPeriod[bill.period] ||= []).push(bill);
  });

  return (
    <main className="p-4 max-w-xl mx-auto space-y-6">
      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Your Share Total"
          value={totals.totalNeighborShare}
        />
        <SummaryCard label="You Paid" value={totals.neighborPaid} />
        <SummaryCard
          label={totals.balance >= 0 ? "You Owe" : "Your Credit"}
          value={Math.abs(totals.balance)}
          highlight={totals.balance >= 0 ? "text-red-600" : "text-green-600"}
        />
      </section>

      {/* MONTHLY BILLS */}
      <section className="space-y-4">
        {Object.entries(billsByPeriod).map(([period, billsInMonth]) => {
          // if you want header to show only THIS MONTH usage owed:
          const monthNeighborCurrent = billsInMonth.reduce((acc, b) => {
            return acc + (Number(b.current_charge) || 0) * 0.3;
          }, 0);

          return (
            <div key={period} className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold flex justify-between">
                <span>{period}</span>
                <span className="text-xs text-gray-500">
                  ${monthNeighborCurrent.toFixed(2)} owed for this month’s
                  usage
                </span>
              </h2>

              <ul className="divide-y">
                {billsInMonth.map((bill) => {
                  const parts = splitBillParts(bill);
                  const prev = Number(bill.previous_balance) || 0;
                  const curr = Number(bill.current_charge) || 0;
                  const total = Number(bill.total_amount) || prev + curr;

                  return (
                    <li
                      key={bill.id}
                      className="py-3 flex justify-between items-start"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          {bill.category}
                        </div>

                        {/* Totals */}
                        <div className="text-xs text-gray-500">
                          Total: ${total.toFixed(2)}
                        </div>

                        {/* Breakdown */}
                        <div className="text-[11px] text-gray-600">
                          Previous: ${prev.toFixed(2)} • Current: $
                          {curr.toFixed(2)}
                        </div>

                        {/* Neighbor split breakdown */}
                        <div className="text-[11px] text-gray-500">
                          Your share → Prev: ${parts.prevNeighbor.toFixed(2)} •
                          Curr: ${parts.currNeighbor.toFixed(2)} •{" "}
                          <span className="font-medium">
                            Total: ${parts.totalNeighbor.toFixed(2)}
                          </span>
                        </div>

                        {/* Bill image link */}
                        {bill.image_url ? (
                          <a
                            href={bill.image_url}
                            target="_blank"
                            className="text-[11px] text-blue-600 underline mt-1 inline-block"
                          >
                            View bill
                          </a>
                        ) : null}

                        {/* Optional notes */}
                        {bill.notes ? (
                          <div className="text-[11px] text-gray-400 mt-1">
                            {bill.notes}
                          </div>
                        ) : null}
                      </div>

                      {/* Right-side quick numbers */}
                      <div className="text-right">
                        <div className="text-sm">
                          Your 30% total: ${parts.totalNeighbor.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Admin 70% total: ${parts.totalAdmin.toFixed(2)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      {/* PAYMENT HISTORY (neighbor payments only) */}
      <section className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Payments</h2>
        <ul className="divide-y text-sm">
          {payments
            .filter((p) => p.payer === "neighbor")
            .map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium">${p.amount.toFixed(2)}</div>
                  {p.note ? (
                    <div className="text-gray-500 text-xs">{p.note}</div>
                  ) : null}
                </div>
                <div className="text-right text-xs text-gray-500">
                  {p.date}
                </div>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}