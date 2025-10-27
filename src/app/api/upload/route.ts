import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "../../../lib /supabase";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { data, error } = await adminClient.storage
            .from("bills")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bill-iamges/${fileName}`;

        return NextResponse.json({ url: publicUrl });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}