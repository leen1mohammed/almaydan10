'use client';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Glow from "@/app/profile/Glow";

export default function VisitorProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const [name, setName]               = useState("");
  const [profilePic, setProfilePic]   = useState("/images/avatars/avatar1.png");
  const [bio, setBio]                 = useState("");
  const [zoneinfo, setZoneinfo]       = useState("");
  const [arenas, setArenas]           = useState([]);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [adminEmail, setAdminEmail]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const decodedUsername = decodeURIComponent(username);

        // 1. Fetch name + email from Member
        const { data: memberData } = await supabase
          .from("Member")
          .select("name, email")
          .eq("userName", decodedUsername)
          .maybeSingle();

        if (!memberData) { setNotFound(true); setLoading(false); return; }
        setName(memberData.name ?? "");

        // 2. Check if admin
        const { data: adminData } = await supabase
          .from("Admin")
          .select("contactInfo")
          .eq("AuserName", decodedUsername)
          .maybeSingle();

        if (adminData) {
          setIsAdmin(true);
          setContactInfo(adminData.contactInfo ?? "");
          setAdminEmail(memberData.email ?? "");
        }

        // 3. Fetch profilePic + bio from Profile
        const { data: profileData } = await supabase
          .from("Profile")
          .select("bio, profilePic")
          .eq("pruserName", decodedUsername)
          .maybeSingle();

        if (profileData) {
          setBio(profileData.bio ?? "");
          setProfilePic(profileData.profilePic || "/images/avatars/avatar1.png");
        }

        // 4. Only fetch zoneinfo + arenas for non-admins
        if (!adminData) {
          const { data: participantData } = await supabase
            .from("Participant")
            .select("zoneinfo")
            .eq("PuserName", decodedUsername)
            .maybeSingle();
          if (participantData) setZoneinfo(participantData.zoneinfo ?? "");

          const { data: joinsData } = await supabase
            .from("Joins")
            .select("ArenaName, Arena(name, logo, pic, description)")
            .eq("PUserName", decodedUsername);
          if (joinsData) setArenas(joinsData.map((j) => j.Arena).filter(Boolean));
        }

      } catch (err) {
        console.error("Visitor profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#061125] flex items-center justify-center text-white opacity-60 font-['Cairo']">
        <p className="animate-pulse text-2xl">جاري تحميل الملف الشخصي...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#061125] flex flex-col items-center justify-center text-white font-['Cairo'] gap-6">
        <p className="text-2xl font-bold">المستخدم غير موجود 😕</p>
        <button onClick={() => router.back()}
          className="px-6 py-2 rounded-full border border-[#B37FEB] text-white hover:bg-[#B37FEB]/20 transition-all">
          رجوع
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061125] text-white flex flex-col items-center font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <Glow />

      <div className="z-10 w-full max-w-[923px] flex flex-col items-center pb-28 px-4" style={{ direction: "rtl" }}>

        {/* Title */}
        <h1 className="w-full text-center text-[80px] font-[900] leading-[100px] text-white mt-10 mb-16"
          style={{ textShadow: "0 3px 0 #FF27F0" }}>
          الملف الشخصي
        </h1>

        {/* Avatar + Name + Username */}
        <div className="flex flex-col items-center gap-4 mb-14">
          <div className="w-[140px] h-[140px] rounded-full border-[2px] border-[#B37FEB] overflow-hidden p-1 bg-[#1A0B36]"
            style={{ boxShadow: "0 0 30px rgba(179,127,235,0.5)" }}>
            <img src={profilePic} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="text-center">
            <h2 className="text-[28px] font-[900]">{name || decodeURIComponent(username)}</h2>
            <p className="text-[16px] opacity-50 mt-1">@{decodeURIComponent(username)}</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-[12px] font-bold px-3 py-1 rounded-full border border-[#29FF64]/40 text-[#29FF64]"
                style={{ background: "rgba(41,255,100,0.08)" }}>
                ADMIN 🛡️
              </span>
            )}
          </div>
        </div>

        {/* ADMIN: contact card */}
        {isAdmin ? (
          <div className="w-full mb-10">
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(179,127,235,0.3)",
              borderRadius: "16px",
              overflow: "hidden",
              width: "100%",
            }}>

              {/* Header */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderBottom: "0.5px solid rgba(179,127,235,0.2)",
              }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "rgba(41,255,100,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", flexShrink: 0,
                }}>🛡️</div>
                <div>
                  <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "white", fontFamily: "Cairo, sans-serif" }}>
                    للتواصل مع المشرف
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)", fontFamily: "Cairo, sans-serif" }}>
                    هذا المستخدم مسؤول في الميدان
                  </p>
                </div>
                <span style={{
                  marginRight: "auto",
                  background: "rgba(41,255,100,0.1)",
                  color: "#29FF64",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(41,255,100,0.3)",
                  fontFamily: "Cairo, sans-serif",
                }}>ADMIN</span>
              </div>

              {/* Contact rows */}
              <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Phone */}
                {contactInfo ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(41,255,100,0.2)",
                    borderRadius: "12px", padding: "14px 16px",
                  }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: "rgba(41,255,100,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", flexShrink: 0,
                    }}>📱</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "Cairo, sans-serif" }}>رقم الجوال</p>
                      <p style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: "white", direction: "ltr", textAlign: "right", fontFamily: "Cairo, sans-serif" }}>
                        {contactInfo}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px", padding: "14px 16px", opacity: 0.4,
                  }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", flexShrink: 0,
                    }}>📱</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "Cairo, sans-serif" }}>رقم الجوال</p>
                      <p style={{ margin: "3px 0 0", fontSize: "15px", color: "rgba(255,255,255,0.3)", fontFamily: "Cairo, sans-serif" }}>لم يُضف رقم بعد</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {adminEmail && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(179,127,235,0.2)",
                    borderRadius: "12px", padding: "14px 16px",
                  }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: "rgba(179,127,235,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", flexShrink: 0,
                    }}>📧</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "Cairo, sans-serif" }}>البريد الإلكتروني</p>
                      <p style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: "white", direction: "ltr", textAlign: "right", fontFamily: "Cairo, sans-serif" }}>
                        {adminEmail}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        ) : (
          <>
            {/* عنك */}
            <div className="w-full flex flex-col gap-3 mb-10">
              <h3 className="text-[20px] font-[700] text-right text-white">عنك</h3>
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

            {/* Zone Info */}
            <div className="w-full mb-10">
              <div className="flex flex-row-reverse items-center justify-end gap-3 mb-4">
                <span className="text-[28px]">🏆</span>
                <h3 className="text-[22px] font-[900] text-right text-white font-['Cairo']" dir="rtl">ساحة الانجازات </h3>
              </div>
              <div className="w-full rounded-2xl p-[1.5px] relative"
                style={{ background: zoneinfo ? "linear-gradient(135deg, #FF27F0, #B37FEB, #29FF64)" : "linear-gradient(135deg, #333, #555)" }}>
                <div className="w-full rounded-2xl px-6 py-6 flex flex-col gap-4"
                  style={{ background: "linear-gradient(145deg, #0D0A2E, #0a1628)", boxShadow: "inset 0 0 40px rgba(179,127,235,0.07)" }}>
                  {zoneinfo ? (
                    <p className="text-right text-white/80 text-[14px] font-['Cairo'] leading-loose whitespace-pre-wrap">{zoneinfo}</p>
                  ) : (
                    <p className="text-right text-white/25 text-[14px] font-['Cairo'] italic">
                      هذا اللاعب لم يُضف إنجازاته بعد... 🏅
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Arenas */}
            {arenas.length > 0 && (
              <div className="w-full mb-10">
                <div className="flex flex-row-reverse items-center justify-end gap-3 mb-4">
                  <span className="text-[28px]">⚔️</span>
                  <h3 className="text-[22px] font-[900] text-right text-white font-['Cairo']">الساحات</h3>
                  
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ direction: "rtl" }}>
                  {arenas.slice().reverse().map((arena, i) => (
                    <div key={i}
                      className="w-full rounded-2xl p-[1.5px]"
                      style={{ background: "linear-gradient(135deg, #B37FEB, #29FF64)" }}>
                      <div className="rounded-2xl px-4 py-4 flex flex-row items-center gap-3  "
                        style={{ background: "linear-gradient(145deg, #0D0A2E, #0a1628)" }}>

                          
                        <div className="text-right flex-1 ">
                          <p className="text-white font-bold text-[15px] font-['Cairo'] rtl">{arena.name}</p>
                          {arena.description && (
                            <p className="text-white/40 text-[12px] font-['Cairo'] mt-1 line-clamp-1">{arena.description}</p>
                          )}
                        </div>
                        {arena.logo && (
                          <img src={arena.logo} alt={arena.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => router.back()}
          className="mt-4 px-8 py-3 rounded-full border border-[#B37FEB] text-white hover:bg-[#B37FEB]/20 transition-all font-['Cairo'] font-bold">
          رجوع
        </button>

      </div>
    </main>
  );
}