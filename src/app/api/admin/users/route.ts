import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("admin_users")
    .select("id, enabled")
    .eq("id", userId)
    .single();
  return !!data && data.enabled !== false;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const payload = users || [];
    let enriched = payload;

    const userIds = payload.map((u) => u.id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: faces, error: faceError } = await supabase
        .from("faceverification")
        .select("*")
        .in("user_id", userIds);

      if (!faceError && Array.isArray(faces)) {
        const faceMap = new Map<string, Record<string, unknown>>();
        faces.forEach((row) => {
          const userId = (row as { user_id?: string }).user_id;
          if (userId) faceMap.set(userId, row as Record<string, unknown>);
        });
        enriched = payload.map((u) => ({
          ...u,
          face_verification: faceMap.get(u.id) || null,
        }));
      }
    }

    return NextResponse.json({ users: enriched, profiles: enriched });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
