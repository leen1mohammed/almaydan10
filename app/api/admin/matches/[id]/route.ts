import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function isAdmin(userName: string) {
  if (!userName) return false;

  const { data, error } = await supabase
    .from("Admin")
    .select("AuserName")
    .eq("AuserName", userName)
    .maybeSingle();

  if (error) {
    console.error("admin check error:", error);
    return false;
  }

  return !!data;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DELETE ROUTE HIT");

    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const adminUserName = searchParams.get("adminUserName") || "";
    const source = searchParams.get("source") || "api";

    console.log("DELETE DATA:", {
      id,
      source,
      adminUserName,
    });

    const allowed = await isAdmin(adminUserName);

    if (!allowed) {
      return NextResponse.json(
        { error: "غير مصرح لك بحذف مباراة" },
        { status: 403 }
      );
    }

    if (source === "manual") {
      const { error } = await supabase
        .from("app_matches")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        deletedId: id,
        source,
      });
    }

    const { error } = await supabase.from("app_matches").insert([
      {
        source: "api",
        external_id: id,
        is_deleted: true,
        status: "UPCOMING",
        game_type: "default",
        tournament_name: "Deleted API Match",
        team_a_name: "Team A",
        team_b_name: "Team B",
        team_a_score: 0,
        team_b_score: 0,
        created_by: adminUserName,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedId: id,
      source,
    });
  } catch (error) {
    console.error("delete match error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "فشل حذف المباراة",
      },
      { status: 500 }
    );
  }
}