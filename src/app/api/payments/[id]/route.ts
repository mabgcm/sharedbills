// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../../lib /supabase";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await adminClient
        .from("payment")
        .delete()
        .eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}