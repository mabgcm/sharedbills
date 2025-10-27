// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../../lib /supabase";

export async function DELETE(
    req: Request,
    context: { params: { id: string } }
) {
    const id = context.params.id;

    const { error } = await adminClient
        .from("payment")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}