// src/app/api/payments/[id]/route.ts
import { NextResponse } from "next/server";
import { adminClient } from "../../../../lib /supabase";

export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) {
        return NextResponse.json(
            { error: "Missing payment id in URL" },
            { status: 400 }
        );
    }

    const { error } = await adminClient
        .from("payment")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}