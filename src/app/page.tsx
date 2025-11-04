// src/app/page.tsx
import { splitBillParts, Bill, Payment } from "../lib /calc";
import "./granny.css";

/** Helper: build class names */
function cx(...vals: Array<string | false | null | undefined>) {
  return vals.filter(Boolean).join(" ");
}

/** Fetch neighbor-visible data from our server route. */
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
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // dev fallback
  const res2 = await fetch(`${base}/api/public-data`, { cache: "no-store" });
  return res2.json();
}

function SummaryCard({
  label,
  value,
  highlight,
  easy,
}: {
  label: string;
  value: number;
  highlight?: string;
  easy: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-xl shadow border",
        easy ? "bg-white p-4" : "bg-white p-3"
      )}
    >
      <div className={cx("text-gray-600", easy ? "text-base" : "text-[11px]")}>
        {label}
      </div>
      <div
        className={cx(
          "font-semibold",
          highlight || "",
          easy ? "text-2xl mt-1" : "text-lg"
        )}
      >
        ${Number(value || 0).toFixed(2)}
      </div>
    </div>
  );
}

/** Neighbor page (server component) with Easy View (`?easy=1`) */
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const easy = sp.easy === "1";

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

  // Build the toggle link for Easy View
  const toggleHref = easy ? "/" : "/?easy=1";

  return (
    <main
      className={cx(
        "mx-auto",
        easy ? "max-w-2xl p-4 sm:p-6 bg-[#FFFDF7]" : "max-w-xl p-4 space-y-6"
      )}
    >
      {/* Header + Easy View toggle */}
      <header
        className={cx(
          "flex items-center justify-between mb-4",
          easy ? "mb-6" : "mb-4"
        )}
      >
        <h1 className={cx("font-bold", easy ? "text-2xl" : "text-xl")}>
          Shared Bills
        </h1>
        <p>108 Nottingham Rd</p>
        <a
          href={toggleHref}
          className={cx(
            "rounded",
            easy
              ? "px-4 py-3 text-base bg-emerald-600 text-white"
              : "px-3 py-2 text-sm bg-yellow-600 text-white"
          )}
          aria-label="Toggle Easy View"
        >
          {easy ? "Standard View" : "👵 Easy View"}
        </a>
      </header>
      <section>
        <p>Water Bill is not included. Will be added soon.</p>
      </section>

      {/* SUMMARY CARDS */}
      <section
        className={cx(
          "grid grid-cols-1 gap-3",
          easy ? "sm:grid-cols-3" : "sm:grid-cols-3"
        )}
      >
        <SummaryCard
          label="Your Share Total"
          value={totals.totalNeighborShare}
          easy={easy}
        />
        <SummaryCard label="You Paid" value={totals.neighborPaid} easy={easy} />
        <SummaryCard
          label={totals.balance >= 0 ? "You Owe" : "Your Credit"}
          value={Math.abs(totals.balance)}
          highlight={totals.balance >= 0 ? "text-red-600" : "text-green-700"}
          easy={easy}
        />
      </section>

      {/* MONTHLY BILLS */}
      <section className={cx("space-y-4", easy && "space-y-6")}>
        {Object.entries(billsByPeriod).map(([period, billsInMonth]) => {
          // Show header figure as this month's usage (not carry-overs)
          const monthNeighborCurrent = billsInMonth.reduce((acc, b) => {
            return acc + (Number(b.current_charge) || 0) * 0.3;
          }, 0);

          return (
            <div
              key={period}
              className={cx(
                "rounded-xl shadow bg-white",
                easy ? "p-5 border-2" : "p-4"
              )}
            >
              <h2
                className={cx(
                  "font-semibold flex justify-between items-center",
                  easy ? "text-xl mb-3" : "text-lg"
                )}
              >
                <span>{period}</span>
                <span className={cx("text-gray-600", easy ? "text-base" : "text-xs")}>
                  ${monthNeighborCurrent.toFixed(2)} your share for this month’s usage
                </span>
              </h2>

              <ul className={cx("divide-y", easy ? "divide-gray-200" : "")}>
                {billsInMonth.map((bill) => {
                  const parts = splitBillParts(bill);
                  const prev = Number(bill.previous_balance) || 0;
                  const curr = Number(bill.current_charge) || 0;
                  const total = Number(bill.total_amount) || prev + curr;

                  return (
                    <li
                      key={bill.id}
                      className={cx(
                        "flex justify-between items-start",
                        easy ? "py-4" : "py-3"
                      )}
                    >
                      {/* Left column */}
                      <div className="min-w-0">
                        <div
                          className={cx(
                            "font-medium",
                            easy ? "text-lg" : "text-sm"
                          )}
                        >
                          {bill.category}
                        </div>

                        {/* Totals */}
                        <div
                          className={cx(
                            "text-gray-600",
                            easy ? "text-base mt-1" : "text-xs"
                          )}
                        >
                          Total: ${total.toFixed(2)}
                        </div>

                        {/* Breakdown */}
                        <div
                          className={cx(
                            "text-gray-700",
                            easy ? "text-base mt-1" : "text-[11px]"
                          )}
                        >
                          Previous: ${prev.toFixed(2)} • Current: ${curr.toFixed(2)}
                        </div>

                        {/* Neighbor split breakdown */}
                        <div
                          className={cx(
                            "text-gray-600",
                            easy ? "text-base mt-1" : "text-[11px]"
                          )}
                        >
                          Your share → Prev: ${parts.prevNeighbor.toFixed(2)} • Curr: $
                          {parts.currNeighbor.toFixed(2)} •{" "}
                          <span className="font-semibold">
                            Total: ${parts.totalNeighbor.toFixed(2)}
                          </span>
                        </div>

                        {/* Bill image link */}
                        {bill.image_url ? (
                          <a
                            href={bill.image_url}
                            target="_blank"
                            className={cx(
                              "text-blue-700 underline inline-block",
                              easy ? "text-base mt-2" : "text-[11px] mt-1"
                            )}
                          >
                            View bill
                          </a>
                        ) : null}

                        {/* Optional notes */}
                        {bill.notes ? (
                          <div
                            className={cx(
                              "text-gray-500",
                              easy ? "text-base mt-2" : "text-[11px] mt-1"
                            )}
                          >
                            {bill.notes}
                          </div>
                        ) : null}
                      </div>

                      {/* Right column */}
                      <div className="text-right ml-3 shrink-0">
                        <div className={cx(easy ? "text-lg" : "text-sm")}>
                          Your 30% total: ${parts.totalNeighbor.toFixed(2)}
                        </div>
                        <div
                          className={cx(
                            "text-gray-500",
                            easy ? "text-sm" : "text-[10px]"
                          )}
                        >
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
      <section className={cx("rounded-xl shadow bg-white", easy ? "p-5 border-2" : "p-4")}>
        <h2 className={cx("font-semibold mb-2", easy ? "text-xl" : "text-lg")}>
          Payments
        </h2>
        <ul className="divide-y">
          {payments
            .filter((p) => p.payer === "neighbor")
            .map((p) => (
              <li
                key={p.id}
                className={cx("flex justify-between items-start", easy ? "py-3" : "py-2")}
              >
                <div>
                  <div className={cx("font-medium", easy ? "text-lg" : "text-sm")}>
                    ${Number(p.amount).toFixed(2)}
                  </div>
                  {p.note ? (
                    <div className={cx("text-gray-600", easy ? "text-base" : "text-xs")}>
                      {p.note}
                    </div>
                  ) : null}
                </div>
                <div
                  className={cx(
                    "text-right text-gray-500",
                    easy ? "text-base" : "text-xs"
                  )}
                >
                  {p.date}
                </div>
              </li>
            ))}
        </ul>
      </section>

      {/* Footer hint for toggle */}
      <p
        className={cx(
          "text-center text-gray-500 mt-4",
          easy ? "text-base" : "text-xs"
        )}
      >
        Tip: Use the {easy ? "Standard View" : "👵 Easy View"} button above to switch
        display styles.
      </p>
    </main>
  );
}