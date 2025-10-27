// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../lib /supabase";

export async function POST(req: NextRequest) {
    const body = await req.json();
    // body = { date, payer, amount, note }

    const { data, error } = await adminClient
        .from("payment")
        .insert([
            {
                date: body.date,
                payer: body.payer,
                amount: body.amount,
                note: body.note ?? null,
            },
        ])
        .select("*")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payment: data });
}