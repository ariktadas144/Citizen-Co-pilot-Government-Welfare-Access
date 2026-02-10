import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || "documents";
const DEFAULT_EXPIRY_SECONDS = 60 * 5;

const extractPath = (input: string) => {
  if (!input) return null;
  try {
    const url = new URL(input);
    const marker = `/${DOCUMENTS_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      const raw = url.pathname.slice(idx + marker.length);
      return decodeURIComponent(raw.replace(/^\/+/, ""));
    }
  } catch {
    // Not a URL, treat as path
  }

  return input.replace(/^\/?documents\//, "").replace(/^\/+/, "");
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path, url, expiresIn } = await request.json();
    const filePath = extractPath(path || url || "");

    if (!filePath) {
      return NextResponse.json({ error: "Document path required" }, { status: 400 });
    }

    const expiry =
      typeof expiresIn === "number" && Number.isFinite(expiresIn)
        ? Math.max(60, Math.floor(expiresIn))
        : DEFAULT_EXPIRY_SECONDS;

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiry);

    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: data.signedUrl,
      path: filePath,
      expiresIn: expiry,
    });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
  }
}
