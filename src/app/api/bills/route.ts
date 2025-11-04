// src/app/api/bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../lib /supabase";

export async function POST(req: NextRequest) {
    const body = await req.json();
    // body: { period, category, previous_balance, current_charge, notes?, image_url? }

    const previous_balance = Number(body.previous_balance ?? 0);
    const current_charge = Number(body.current_charge ?? 0);
    const total_amount = previous_balance + current_charge;

    const { data, error } = await adminClient
        .from("bills")
        .insert([
            {
                period: body.period,
                category: body.category,
                previous_balance,
                current_charge,
                total_amount,
                notes: body.notes ?? null,
                image_url: body.image_url ?? null,
            },
        ])
        .select("*")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bill: data });
}