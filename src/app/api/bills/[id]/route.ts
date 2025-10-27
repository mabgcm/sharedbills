// src/app/api/bills/[id]/route.ts
import { NextResponse } from "next/server";
import { adminClient } from "../../../../lib /supabase";

export async function DELETE(req: Request) {
    // Extract the bill ID from the URL manually
    // req.url will look like: https://yourdomain.vercel.app/api/bills/<id>
    const url = new URL(req.url);
    const segments = url.pathname.split("/"); // ["", "api", "bills", "<id>"]
    const id = segments[segments.length - 1];

    if (!id) {
        return NextResponse.json(
            { error: "Missing bill id in URL" },
            { status: 400 }
        );
    }

    const { error } = await adminClient
        .from("bills")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}