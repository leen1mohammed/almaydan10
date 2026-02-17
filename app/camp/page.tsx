"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      // 1️⃣ جلب المستخدم الحالي من الـ session
      const currentUser = await authService.getCurrentUser();

      if (!currentUser || !currentUser.email) {
        router.push("/login");
        return;
      }

      // 2️⃣ جلب userName من Member
      const { data: memberData } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", currentUser.email)
        .single();

      if (!memberData) {
        router.push("/login");
        return;
      }

      const userName = memberData.userName;

      // 3️⃣ تحقق هل Admin
      const { data: adminData } = await supabase
        .from("Admin")
        .select("AuserName")
        .eq("AuserName", userName)
        .maybeSingle();

      if (adminData) {
        router.push("/");
        return;
      }

      // 4️⃣ تحقق هل Participant
      const { data: participantData } = await supabase
        .from("Participant")
        .select("PuserName")
        .eq("PuserName", userName)
        .maybeSingle();

      if (!participantData) {
        router.push("/");
        return;
      }

      // 5️⃣ هل عنده معسكر؟
      const { data: camp } = await supabase
        .from("Camp")
        .select("id")
        .eq("creatorID", userName)
        .maybeSingle();

      if (camp) {
        router.push(`/camp/${camp.id}`);
      } else {
        router.push("/camp/create");
      }
    };

    routeUser();
  }, [router]);

  return null; // صفحة بوابة فقط بدون UI
}
