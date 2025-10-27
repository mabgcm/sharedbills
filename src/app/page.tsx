import { publicClient } from "../lib /supabase";
import { splitBill, getTotals, Bill, Payment } from "../lib /calc";

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
        ${value.toFixed(2)}
      </span>
    </div>
  );
}

export default async function Page() {
  // fetch bills
  const { data: bills } = await publicClient
    .from("bills")
    .select("*")
    .order("period", { ascending: false })
    .order("created_at", { ascending: false });

  // fetch payments (from 'payment' table)
  const { data: payments } = await publicClient
    .from("payment")
    .select("*")
    .order("date", { ascending: false });

  const safeBills: Bill[] = bills ?? [];
  const safePayments: Payment[] = payments ?? [];

  const totals = getTotals(safeBills, safePayments);

  // group bills by period (e.g. "2025-10")
  const billsByPeriod: Record<string, Bill[]> = {};
  safeBills.forEach((bill) => {
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
          // sum neighbor share for this month
          const monthNeighborTotal = billsInMonth.reduce((acc, b) => {
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
                {billsInMonth.map((bill) => {
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
          {safePayments
            .filter((p) => p.payer === "neighbor")
            .map((p) => (
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