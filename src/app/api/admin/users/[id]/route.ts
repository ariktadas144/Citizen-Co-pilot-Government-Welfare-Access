import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function isAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("admin_users")
    .select("id, enabled")
    .eq("id", userId)
    .single();
  return !!data && data.enabled !== false;
}

const ALLOWED_FIELDS = new Set([
  "full_name",
  "email",
  "phone",
  "date_of_birth",
  "gender",
  "aadhaar_number",
  "voter_id_number",
  "document_type",
  "document_url",
  "id_document_url",
  "address_line",
  "district",
  "state",
  "pincode",
  "annual_income",
  "caste_category",
  "occupation",
  "disability_status",
  "id_verified",
  "face_verified",
  "onboarding_completed",
  "avatar_url",
  "face_front_url",
  "face_left_url",
  "face_right_url",
  "face_image_front",
  "face_image_left",
  "face_image_right",
  "uploaded_documents",
  "interested_tags",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body || {})) {
      if (ALLOWED_FIELDS.has(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Admin user update error:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
