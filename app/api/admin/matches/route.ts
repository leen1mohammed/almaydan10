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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      adminUserName,
      status,
      game_type,
      start_at,
      tournament_name,
      team_a_name,
      team_b_name,
      team_a_logo,
      team_b_logo,
      team_a_score,
      team_b_score,
      stream_url,
    } = body;

    const allowed = await isAdmin(adminUserName);

    if (!allowed) {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة مباراة" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("app_matches")
      .insert([
        {
          source: "manual",
          status,
          game_type,
          start_at,
          tournament_name,
          team_a_name,
          team_b_name,
          team_a_logo,
          team_b_logo,
          team_a_score: Number(team_a_score || 0),
          team_b_score: Number(team_b_score || 0),
          stream_url,
          created_by: adminUserName,
          is_deleted: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("insert match error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      match: data,
    });
  } catch (error) {
    console.error("POST MATCH ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "فشل إضافة المباراة",
      },
      { status: 500 }
    );
  }
}