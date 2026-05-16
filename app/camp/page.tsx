"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";

export default function CampPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasCamp, setHasCamp] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCamp = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (!currentUser?.email) {
          router.replace("/login");
          return;
        }

        let userName = (currentUser as any)?.userName;

        if (!userName) {
          const { data } = await supabase
            .from("Member")
            .select("userName")
            .eq("email", currentUser.email)
            .single();

          userName = data?.userName;
        }

        if (!userName) {
          router.replace("/login");
          return;
        }

        const { data: participant } = await supabase
          .from("Participant")
          .select("PuserName")
          .eq("PuserName", userName)
          .maybeSingle();

        if (!participant) {
          router.replace("/");
          return;
        }

        const { data: membership } = await supabase
          .from("CampParticipants")
          .select("campId")
          .eq("pUserName", userName)
          .maybeSingle();

        if (!mounted) return;

        if (membership?.campId) {
          router.replace(`/camp/${membership.campId}`);
          return;
        }
        const { data: ownedCamp } = await supabase
        .from("Camp")
        .select("id")
        .eq("creatorUser", userName)
      .maybeSingle();

if (!mounted) return;

if (ownedCamp?.id) {
  await supabase.from("CampParticipants").insert([{
    campId: ownedCamp.id,
    pUserName: userName,
    joinedAt: new Date().toISOString(),
  }]);
  router.replace(`/camp/${ownedCamp.id}`);
  return;
}        
        setHasCamp(false);
      } catch {
        router.replace("/");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkCamp();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#061125] flex items-center justify-center text-white">
        <p className="animate-pulse text-2xl">
          جاري تجهيز المعسكر ...
        </p>
      </main>
    );
  }

  if (!hasCamp) {
    return (
      <div className="min-h-screen text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-2xl text-white/30 mb-8">
              لا يوجد لديك معسكر حتى الآن..
            </p>

            <button
              type="button"
              onClick={() => router.push("/camp/create")}
              className="px-10 py-3 rounded-full bg-purple-700 hover:bg-purple-600 transition shadow-lg"
            >
              أنشئ معسكرك
            </button>
          </div>
        </div>

        <div className="h-8" />
      </div>
    );
  }

  return null;
}