"use client";

/**
 * الملف: app/camp/page.tsx
 * الدور: بوابة المعسكر (Entry) تقرر أين تودّي المستخدم بناءً على حالته.
 *
 * يرتبط بـ:
 * - authService.getCurrentUser()
 * - جداول Supabase: Member, Admin, Participant, CampParticipants
 * - صفحات:
 *   - /camp/[id] (إذا عنده معسكر)
 *   - /camp/empty (إذا ما عنده معسكر)
 *   - /login (إذا مو مسجل)
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      try {
        // 1) التحقق من تسجيل الدخول
        const currentUser = await authService.getCurrentUser();
        if (!currentUser?.email) {
          router.replace("/login");
          return;
        }

        // 2) جلب userName من Member باستخدام email
        const { data: memberData, error: memberError } = await supabase
          .from("Member")
          .select("userName")
          .eq("email", currentUser.email)
          .single();

        if (memberError || !memberData?.userName) {
          console.error("Member fetch error:", memberError);
          router.replace("/login");
          return;
        }

        const userName = memberData.userName;

        // 3) استعلامات متوازية لتسريع القرار
        const [adminCheck, participantCheck, membershipCheck] = await Promise.all([
          supabase.from("Admin").select("AuserName").eq("AuserName", userName).maybeSingle(),
          supabase.from("Participant").select("PuserName").eq("PuserName", userName).maybeSingle(),
          supabase
            .from("CampParticipants")
            .select("campId")
            .eq("pUserName", userName)
            .maybeSingle(),
        ]);

        // 4) منع الأدمن
        if (adminCheck.data) {
          router.replace("/");
          return;
        }

        // 5) السماح فقط للمشاركين
        if (!participantCheck.data) {
          router.replace("/");
          return;
        }

        // 6) إذا عنده campId → صفحة المعسكر، وإلا → صفحة Empty
        if (membershipCheck.data?.campId) {
          router.replace(`/camp/${membershipCheck.data.campId}`);
        } else {
          router.replace("/camp/empty");
        }
      } catch (err) {
        console.error("Camp routing error:", err);
        router.replace("/");
      }
    };

    routeUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="animate-pulse text-purple-400 text-lg">جاري تجهيز المعسكر...</div>
    </div>
  );
}