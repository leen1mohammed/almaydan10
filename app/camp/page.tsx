"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        console.log("currentUser:", currentUser); // ← debug

        if (!currentUser?.email) {
          router.replace("/login");
          return;
        }

        let userName = (currentUser as any)?.userName as string | undefined;
        if (!userName) {
          const { data: memberData } = await supabase
            .from("Member")
            .select("userName")
            .eq("email", currentUser.email)
            .single();
          userName = memberData?.userName;
        }

        if (!userName) {
          router.replace("/login");
          return;
        }

        console.log("userName:", userName); // ← debug

        // فقط Participant
        const { data: participantRow, error: participantError } = await supabase
          .from("Participant")
          .select("PuserName")
          .eq("PuserName", userName)
          .maybeSingle();

        console.log("participantRow:", participantRow); // ← debug
        console.log("participantError:", participantError); // ← debug

        if (!participantRow) {
          router.replace("/");
          return;
        }

        // هل عنده Camp؟
        const { data: membership } = await supabase
          .from("CampParticipants")
          .select("campId")
          .eq("pUserName", userName)
          .maybeSingle();

        if (membership?.campId) {
          router.replace(`/camp/${membership.campId}`);
        } else {
          router.replace("/camp/empty");
        }
      } catch (e) {
        console.error(e);
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