import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: "Invalid token" }, { status: 400 });
    }

    const currentUser = await authService.getCurrentUser();

    if (!currentUser?.email) {
      return Response.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    // get username
    const { data: member } = await supabase
      .from("Member")
      .select("userName")
      .eq("email", currentUser.email)
      .single();

    const userName = member?.userName;

    // check participant
    const { data: participant } = await supabase
      .from("Participant")
      .select("PuserName")
      .eq("PuserName", userName)
      .maybeSingle();

    if (!participant) {
      return Response.json({ error: "فقط المشاركين يمكنهم الانضمام" });
    }

    // check already in camp
    const { data: existing } = await supabase
      .from("CampParticipants")
      .select("*")
      .eq("pUserName", userName)
      .maybeSingle();

    if (existing) {
      return Response.json({
        error: "لديك معسكر بالفعل",
      });
    }

    // get camp
    const { data: camp } = await supabase
      .from("Camp")
      .select("id")
      .eq("inviteToken", token)
      .single();

    if (!camp) {
      return Response.json({ error: "الرابط غير صالح" });
    }

    // join
    await supabase.from("CampParticipants").insert([
      {
        campId: camp.id,
        pUserName: userName,
        joinedAt: new Date().toISOString(),
      },
    ]);

    return Response.json({
      success: true,
      campId: camp.id,
    });

  } catch (e) {
    console.error(e);
    return Response.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}