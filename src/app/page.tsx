import { splitBill } from "../lib /calc";

// helper to fetch data from our own API route
async function getPublicData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/public-data`, {
    cache: "no-store",
  });

  // Fallback for local dev (Next.js server component environment doesn't
  // always have NEXT_PUBLIC_BASE_URL). We'll attempt relative fetch if needed.
  if (!res.ok) {
    const altRes = await fetch("http://localhost:3000/api/public-data", {
      cache: "no-store",
    });
    return altRes.json();
  }

  return res.json();
}

export default async function Page() {
  // data: { bills, payments, totals }
  const data = await getPublicData();

  const bills = data?.bills || [];
  const payments = data?.payments || [];
  const totals = data?.totals || {
    totalNeighborShare: 0,
    neighborPaid: 0,
    balance: 0,
  };

  // group bills by period
  const billsByPeriod: Record<string, any[]> = {};
  bills.forEach((bill: any) => {
    if (!billsByPeriod[bill.period]) billsByPeriod[bill.period] = [];
    billsByPeriod[bill.period].push(bill);
  });

  return (
    <main className="p-4 max-w-xl mx-auto space-y-6">
      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Your Share Total"
          value={totals.totalNeighborShare}
        />
        <SummaryCard
          label="You Paid"
          value={totals.neighborPaid}
        />
        <SummaryCard
          label={totals.balance >= 0 ? "You Owe" : "Your Credit"}
          value={Math.abs(totals.balance)}
          highlight={totals.balance >= 0 ? "text-red-600" : "text-green-600"}
        />
      </section>

      {/* MONTHLY BILLS */}
      <section className="space-y-4">
        {Object.entries(billsByPeriod).map(([period, billsInMonth]) => {
          // sum neighbor portion for that month
          const monthNeighborTotal = (billsInMonth as any[]).reduce((acc, b) => {
            return acc + b.amount_total * 0.3;
          }, 0);

          return (
            <div key={period} className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold flex justify-between">
                <span>{period}</span>
                <span className="text-xs text-gray-500">
                  ${monthNeighborTotal.toFixed(2)} owed this month
                </span>
              </h2>

              <ul className="divide-y">
                {(billsInMonth as any[]).map((bill) => {
                  const shares = splitBill(bill.amount_total);
                  return (
                    <li
                      key={bill.id}
                      className="py-3 flex justify-between items-start"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          {bill.category}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: ${bill.amount_total.toFixed(2)}
                        </div>
                        {bill.notes ? (
                          <div className="text-[11px] text-gray-400">
                            {bill.notes}
                          </div>
                        ) : null}
                        {bill.image_url ? (
                          <a
                            href={bill.image_url}
                            target="_blank"
                            className="text-[11px] text-blue-600 underline"
                          >
                            View bill
                          </a>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <div className="text-sm">
                          Your 30%: ${shares.neighborShare.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Admin 70%: ${shares.adminShare.toFixed(2)}
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

      {/* PAYMENT HISTORY */}
      <section className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Payments</h2>
        <ul className="divide-y text-sm">
          {payments
            .filter((p: any) => p.payer === "neighbor")
            .map((p: any) => (
              <li key={p.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium">${p.amount.toFixed(2)}</div>
                  <div className="text-gray-500 text-xs">{p.note}</div>
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
        ${Number(value).toFixed(2)}
      </span>
    </div>
  );
}