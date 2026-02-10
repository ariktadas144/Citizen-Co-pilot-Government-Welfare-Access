import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCUMENTS_BUCKET = "documents";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) || "general";
    const schemeId = formData.get("scheme_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WEBP, DOC, DOCX" },
        { status: 400 }
      );
    }

    // Build file path
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const folder = schemeId ? `${user.id}/applications/${schemeId}` : `${user.id}/${purpose}`;
    const filePath = `${folder}/${timestamp}_${safeName}`;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload document" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath);

    // If this is a profile document (not scheme application), save to user_profiles
    if (!schemeId) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("uploaded_documents")
        .eq("id", user.id)
        .single();

      const existing = (profile?.uploaded_documents as unknown[]) || [];
      const newDoc = {
        name: file.name,
        url: publicUrl,
        path: filePath,
        type: file.type,
        purpose,
        uploaded_at: new Date().toISOString(),
      };

      await supabase
        .from("user_profiles")
        .update({
          uploaded_documents: [...existing, newDoc],
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      path: filePath,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// GET — list user's uploaded documents
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("uploaded_documents")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      documents: (profile?.uploaded_documents as unknown[]) || [],
    });
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// DELETE — remove a document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Document URL required" }, { status: 400 });
    }

    // Remove from user_profiles
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("uploaded_documents")
      .eq("id", user.id)
      .single();

    const docs = ((profile?.uploaded_documents as { url: string }[]) || []).filter(
      (d) => d.url !== url
    );

    await supabase
      .from("user_profiles")
      .update({ uploaded_documents: docs })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
