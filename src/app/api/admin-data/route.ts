// src/app/api/admin-data/route.ts
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { getTotals } from "@/lib/calc";

export async function GET() {
    // get bills
    const { data: bills, error: billsError } = await adminClient
        .from("bills")
        .select("*")
        .order("period", { ascending: false })
        .order("created_at", { ascending: false });

    if (billsError) {
        return NextResponse.json({ error: billsError.message }, { status: 500 });
    }

    // get payments  (table name: payment)
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