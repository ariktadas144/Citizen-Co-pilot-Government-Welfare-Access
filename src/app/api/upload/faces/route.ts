import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FACES_BUCKET = process.env.FACES_BUCKET || "face-verification";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { front } = body;

    if (!front) {
      return NextResponse.json(
        { error: "Front face image is required" },
        { status: 400 }
      );
    }

    const uploads: Record<string, string | null> = {
      face_front_url: null,
    };

    const images = [
      { key: "face_front_url", data: front, name: "front" },
    ];

    for (const img of images) {
      const base64Data = img.data.includes(",")
        ? img.data.split(",")[1]
        : img.data;
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${user.id}/face_${img.name}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(FACES_BUCKET)
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(FACES_BUCKET).getPublicUrl(fileName);
        uploads[img.key] = publicUrl;
      }
    }

    // Store front face url in faceverification table (if available)
    if (uploads.face_front_url) {
      const { error: faceError } = await supabase
        .from("faceverification")
        .upsert(
          {
            user_id: user.id,
            front_url: uploads.face_front_url,
          },
          { onConflict: "user_id" }
        );
      if (faceError) {
        console.error("Face verification upsert error:", faceError);
      }
    }

    // Update user profile — set front face as avatar_url (profile picture)
    await supabase
      .from("user_profiles")
      .update({
        face_front_url: uploads.face_front_url,
        avatar_url: uploads.face_front_url, // Use front face as profile avatar
        face_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      urls: uploads,
    });
  } catch (error) {
    console.error("Face upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload face images" },
      { status: 500 }
    );
  }
}
