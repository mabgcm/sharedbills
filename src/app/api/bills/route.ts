// src/app/api/bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../lib /supabase";

// Create a new bill row
export async function POST(req: NextRequest) {
    const body = await req.json();
    // body = { period, category, amount_total, notes?, image_url? }

    const { data, error } = await adminClient
        .from("bills")
        .insert([
            {
                period: body.period,
                category: body.category,
                amount_total: body.amount_total,
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