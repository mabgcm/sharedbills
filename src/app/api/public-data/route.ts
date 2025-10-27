// src/app/api/public-data/route.ts
import { NextResponse } from "next/server";
import { adminClient } from "../../../lib /supabase";
import { getTotals } from "../../../lib /calc";

// This returns data visible to the neighbor.
// Right now it's basically everything. You can filter later if needed.
export async function GET() {
    // Bills
    const { data: bills, error: billsError } = await adminClient
        .from("bills")
        .select("*")
        .order("period", { ascending: false })
        .order("created_at", { ascending: false });

    if (billsError) {
        return NextResponse.json({ error: billsError.message }, { status: 500 });
    }

    // Payments (from table 'payment')
    // We will include all rows but on the client we only show payer === 'neighbor'
    const { data: payments, error: paymentsError } = await adminClient
        .from("payment")
        .select("*")
        .order("date", { ascending: false });

    if (paymentsError) {
        return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    const totals = getTotals(bills ?? [], payments ?? []);

    return NextResponse.json({
        bills,
        payments,
        totals,
    });
}