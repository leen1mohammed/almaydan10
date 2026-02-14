import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default async function CampEntryPage() {
  // 1️⃣ جلب المستخدم الحالي (من authService)
  const currentUser = await authService.getCurrentUser();

  if (!currentUser || !currentUser.email) {
    redirect("/login");
  }

  // 2️⃣ جلب userName رسميًا من جدول Member باستخدام email
  const { data: memberData, error: memberError } = await supabase
    .from("Member")
    .select("userName")
    .eq("email", currentUser.email)
    .single();

  if (memberError || !memberData) {
    redirect("/login");
  }

  const userName = memberData.userName;

  // 3️⃣ تحقق هل Admin
  const { data: adminData } = await supabase
    .from("Admin")
    .select("AuserName")
    .eq("AuserName", userName)
    .maybeSingle();

  if (adminData) {
    redirect("/"); // الأدمن ممنوع من المعسكرات
  }

  // 4️⃣ تحقق هل Participant
  const { data: participantData } = await supabase
    .from("Participant")
    .select("PuserName")
    .eq("PuserName", userName)
    .maybeSingle();

  if (!participantData) {
    redirect("/"); // فقط المشاركين يقدرون يدخلون
  }

  // 5️⃣ تحقق هل المستخدم أنشأ معسكر مسبقًا
  const { data: camp } = await supabase
    .from("Camp")
    .select("id")
    .eq("creatorID", userName)
    .maybeSingle();

  // 6️⃣ التوجيه حسب الحالة
  if (camp) {
    redirect(`/camp/${camp.id}`);
  } else {
    redirect("/camp/create");
  }
}
