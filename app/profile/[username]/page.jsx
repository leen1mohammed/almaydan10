'use client';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Glow from "@/app/profile/Glow";

export default function VisitorProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const [name, setName]             = useState("");
  const [profilePic, setProfilePic] = useState("/images/avatars/avatar1.png");
  const [bio, setBio]               = useState("");
  const [zoneinfo, setZoneinfo]     = useState("");
  const [arenas, setArenas]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const decodedUsername = decodeURIComponent(username);

        // 1. Fetch name from Member
        const { data: memberData } = await supabase
          .from("Member")
          .select("name")
          .eq("userName", decodedUsername)
          .maybeSingle();

        if (!memberData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setName(memberData.name ?? "");

        // 2. Fetch bio + profilePic from Profile
        const { data: profileData } = await supabase
          .from("Profile")
          .select("bio, profilePic")
          .eq("pruserName", decodedUsername)
          .maybeSingle();

        if (profileData) {
          setBio(profileData.bio ?? "");
          setProfilePic(profileData.profilePic || "/images/avatars/avatar1.png");
        }

        // 3. Fetch zoneinfo from Participant
        const { data: participantData } = await supabase
          .from("Participant")
          .select("zoneinfo")
          .eq("PuserName", decodedUsername)
          .maybeSingle();

        if (participantData) setZoneinfo(participantData.zoneinfo ?? "");

        // 4. Fetch joined arenas
        const { data: joinsData } = await supabase
          .from("Joins")
          .select("ArenaName, Arena(name, logo, pic, description)")
          .eq("PUserName", decodedUsername);

        if (joinsData) {
          setArenas(joinsData.map((j) => j.Arena).filter(Boolean));
        }

      } catch (err) {
        console.error("Visitor profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // ── Loading ──
  if (loading) {
    return (
      <main className="min-h-screen bg-[#061125] flex items-center justify-center text-white font-['Cairo']">
        <p className="animate-pulse text-2xl">جاري تحميل الملف الشخصي...</p>
      </main>
    );
  }

  // ── Not Found ──
  if (notFound) {
    return (
      <main className="min-h-screen bg-[#061125] flex flex-col items-center justify-center text-white font-['Cairo'] gap-6">
        <p className="text-2xl font-bold">المستخدم غير موجود 😕</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-full border border-[#B37FEB] text-white hover:bg-[#B37FEB]/20 transition-all"
        >
          رجوع
        </button>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#061125] text-white flex flex-col items-center font-['Cairo'] relative overflow-x-hidden"
      dir="rtl"
    >
      <Glow />

      <div className="z-10 w-full max-w-[923px] flex flex-col items-center pb-28 px-4">

        {/* ── Title ── */}
        <h1
          className="w-full text-center text-[80px] font-[900] leading-[100px] text-white mt-10 mb-16"
          style={{ textShadow: "0 3px 0 #FF27F0" }}
        >
          الملف الشخصي
        </h1>

        {/* ── Avatar + Name + Username ── */}
        <div className="flex flex-col items-center gap-4 mb-14">
          <div
            className="w-[140px] h-[140px] rounded-full border-[2px] border-[#B37FEB] overflow-hidden p-1 bg-[#1A0B36]"
            style={{ boxShadow: "0 0 30px rgba(179,127,235,0.5)" }}
          >
            <img
              src={profilePic}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-[28px] font-[900]">{name || decodeURIComponent(username)}</h2>
            <p className="text-[16px] opacity-50 mt-1">@{decodeURIComponent(username)}</p>
          </div>
        </div>

        {/* ── عنك (Bio) — always visible ── */}
        <div className="w-full flex flex-col gap-3 mb-10">
          <h3 className="text-[20px] font-[700] text-right text-white">عنه</h3>
          <p className="text-right text-white/40 text-[13px] -mt-1">
            ألعابه المفضلة • فريقه المفضل • نبذة عنه • أهدافه في الإيسبورتس
          </p>
          {bio ? (
            <div className="w-full bg-white/5 border-[1.5px] border-[#B37FEB] rounded-xl px-[14px] py-[14px] text-right text-sm text-white/80 font-['Cairo'] leading-relaxed whitespace-pre-wrap">
              {bio}
            </div>
          ) : (
            <div className="w-full bg-white/5 border-[1.5px] border-[#B37FEB]/30 rounded-xl px-[14px] py-[14px] text-right text-sm text-white/25 font-['Cairo'] leading-relaxed italic">
              هذا اللاعب لم يكتب نبذة عنه بعد... 🎮
            </div>
          )}
        </div>

        {/* ── Zone Info Card — always visible ── */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-end gap-3 mb-4">
            <h3 className="text-[22px] font-[900] text-right text-white font-['Cairo']">
              زون إنفو
            </h3>
            <span className="text-[28px]">🏆</span>
          </div>

          <div
            className="w-full rounded-2xl p-[1.5px] relative"
            style={{
              background: zoneinfo
                ? "linear-gradient(135deg, #FF27F0, #B37FEB, #29FF64)"
                : "linear-gradient(135deg, #B37FEB44, #B37FEB22, #29FF6422)",
            }}
          >
            <div
              className="w-full rounded-2xl px-6 py-6"
              style={{
                background: "linear-gradient(145deg, #0D0A2E, #0a1628)",
                boxShadow: "inset 0 0 40px rgba(179,127,235,0.07)",
              }}
            >
              {/* ZONE badge */}
              <div
                className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full border border-[#FF27F0]/40 text-[#FF27F0]"
                style={{ background: "rgba(255,39,240,0.08)" }}
              >
                ZONE
              </div>

              {zoneinfo ? (
                <p className="text-right text-white/80 text-sm font-['Cairo'] leading-loose whitespace-pre-wrap">
                  {zoneinfo}
                </p>
              ) : (
                <p className="text-right text-white/25 text-sm font-['Cairo'] leading-loose italic pt-4">
                  لم يسجّل هذا اللاعب إنجازاته بعد... ربما هو يتدرب الآن! ⚡
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Joined Arenas — always visible ── */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-[22px] font-[900] text-right text-white font-['Cairo']">
              الساحات المنضم إليها
            </h3>
            <span className="text-[28px]">⚔️</span>
          </div>

          {arenas.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {arenas.map((arena) => (
                <div
                  key={arena.name}
                  onClick={() => router.push(`/arena/${encodeURIComponent(arena.name)}`)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border-[1.5px] border-[#B37FEB]/40 bg-white/5 hover:border-[#FF27F0] hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-black/30 flex items-center justify-center">
                    <img
                      src={arena.logo || "/images/logos/default.png"}
                      alt={arena.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-white text-[13px] font-bold text-center group-hover:text-[#29FF64] transition-colors">
                    {arena.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // ── Empty state ──
            <div
              className="w-full rounded-2xl border-[1.5px] border-dashed border-[#B37FEB]/30 flex flex-col items-center justify-center py-12 gap-3"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span className="text-[48px]">🏟️</span>
              <p className="text-white/30 text-[15px] font-['Cairo'] text-center">
                هذا اللاعب لم ينضم لأي ساحة بعد
              </p>
              <p className="text-white/20 text-[13px] font-['Cairo'] text-center">
                الميدان ينتظره!
              </p>
            </div>
          )}
        </div>

        {/* ── Back Button ── */}
        <button
          onClick={() => router.back()}
          className="mt-6 px-8 py-3 rounded-full border-[1.4px] border-[#B37FEB] text-white font-[700] text-[16px] hover:bg-[#B37FEB]/20 transition-all active:scale-95"
        >
          رجوع ←
        </button>

      </div>
    </main>
  );
}