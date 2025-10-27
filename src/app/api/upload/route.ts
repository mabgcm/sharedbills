import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../lib/supabase";
export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const filePath = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
        .from("bill-images")
        .upload(filePath, arrayBuffer, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL for that file
    const { data: publicUrlData } = adminClient.storage
        .from("bill-images")
        .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
}