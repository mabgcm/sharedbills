import { publicClient } from "@/lib/supabase";

export default async function Page() {
  const { data: bills, error: billsError } = await publicClient
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: payments, error: paymentsError } = await publicClient
    .from("payments")
    .select("*")
    .order("date", { ascending: false });

  // just temporary debug output:
  return (
    <main className="p-4 text-sm">
      <h1 className="font-bold text-lg mb-4">Debug View</h1>

      <section>
        <h2 className="font-semibold">Bills</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify({ bills, billsError }, null, 2)}
        </pre>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Payments</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify({ payments, paymentsError }, null, 2)}
        </pre>
      </section>
    </main>
  );
}